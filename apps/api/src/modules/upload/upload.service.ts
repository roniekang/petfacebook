import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/quicktime'];
const IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const VIDEO_MAX_SIZE = 100 * 1024 * 1024; // 100MB

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private s3: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor() {
    this.endpoint =
      process.env.STORAGE_ENDPOINT || 'http://localhost:9000';
    this.bucket = process.env.STORAGE_BUCKET || 'pettopia';

    this.s3 = new S3Client({
      endpoint: this.endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.STORAGE_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    await this.ensureBucket();
  }

  private async ensureBucket() {
    let bucketExists = false;
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      bucketExists = true;
    } catch (err: any) {
      if (err.name === 'NotFound' || err.name === 'NoSuchBucket' || err.$metadata?.httpStatusCode === 404) {
        this.logger.log(`Bucket "${this.bucket}" not found, creating...`);
        try {
          await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
          this.logger.log(`Bucket "${this.bucket}" created successfully`);
          bucketExists = true;
        } catch (createErr: any) {
          if (createErr.name === 'BucketAlreadyOwnedByYou') {
            bucketExists = true;
          } else {
            this.logger.warn(`Failed to create bucket: ${createErr.message}`);
          }
        }
      } else {
        this.logger.warn(`Could not check bucket: ${err.message}`);
      }
    }

    if (bucketExists) {
      await this.setBucketPublicRead();
    }
  }

  private async setBucketPublicRead() {
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    });

    try {
      await this.s3.send(
        new PutBucketPolicyCommand({ Bucket: this.bucket, Policy: policy }),
      );
      this.logger.log(`Bucket "${this.bucket}" public read policy set`);
    } catch (err: any) {
      this.logger.warn(`Failed to set bucket policy: ${err.message}`);
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    guardianId: string,
  ): Promise<{ url: string }> {
    this.validateFile(file, ALLOWED_IMAGE_MIMES, IMAGE_MAX_SIZE);
    return this.upload(file, 'images', guardianId);
  }

  async uploadImages(
    files: Express.Multer.File[],
    guardianId: string,
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    const urls: string[] = [];
    for (const file of files) {
      this.validateFile(file, ALLOWED_IMAGE_MIMES, IMAGE_MAX_SIZE);
      const result = await this.upload(file, 'images', guardianId);
      urls.push(result.url);
    }
    return { urls };
  }

  async uploadVideo(
    file: Express.Multer.File,
    guardianId: string,
  ): Promise<{ url: string }> {
    this.validateFile(file, ALLOWED_VIDEO_MIMES, VIDEO_MAX_SIZE);
    return this.upload(file, 'videos', guardianId);
  }

  private validateFile(
    file: Express.Multer.File,
    allowedMimes: string[],
    maxSize: number,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed: ${allowedMimes.join(', ')}`,
      );
    }
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large: ${file.size} bytes. Max: ${maxSize} bytes`,
      );
    }
  }

  private async upload(
    file: Express.Multer.File,
    type: string,
    guardianId: string,
  ): Promise<{ url: string }> {
    const ext = extname(file.originalname) || this.getExtFromMime(file.mimetype);
    const key = `${type}/${guardianId}/${randomUUID()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = `${this.endpoint}/${this.bucket}/${key}`;
    return { url };
  }

  private getExtFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
    };
    return map[mime] || '';
  }
}
