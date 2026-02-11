# Pettopia Backend - 개발 스펙 문서

> 실제 구현된 백엔드 API 스펙을 기술합니다. 기획 스펙(`spec.md`)과 달리 현재 코드 기준의 구현 상태를 반영합니다.

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | NestJS v11 (TypeScript) |
| ORM | Prisma |
| DB | PostgreSQL 16 |
| 인증 | JWT (passport-jwt) + bcrypt |
| 파일 저장소 | MinIO (S3 호환, AWS SDK v3) |
| 패키지 매니저 | pnpm (모노레포) |

---

## 핵심 아키텍처

### 1 Guardian = 1 Pet, 1 Pet = N Guardians

- 집사(Guardian) 1명은 펫 1개에만 연결 가능
- 펫(PetAccount) 1개는 여러 집사를 가질 수 있음
- PetGuardian 조인 테이블로 관계 관리
- `guardianId`에 `@unique` 제약 → 1집사 1펫 보장

### PetGuardian 모델

```
PetGuardian {
  id            String          @id @default(uuid())
  petAccountId  String          → PetAccount
  guardianId    String @unique  → Guardian (1집사 1펫)
  role          GuardianRole    (OWNER | ADMIN | MEMBER)
  status        GuardianStatus  (PENDING | ACCEPTED | REJECTED)
  invitedBy     String?         → Guardian
  createdAt     DateTime
  acceptedAt    DateTime?
  @@unique([petAccountId, guardianId])
}
```

### 역할 권한

| 권한 | OWNER | ADMIN | MEMBER |
|------|-------|-------|--------|
| 펫 프로필 수정 | O | O | X |
| 펫 삭제 | O | X | X |
| 집사 초대 | O | O | X |
| 집사 제거 | O | X | X |
| 역할 변경 | O | X | X |
| 게시글/댓글/좋아요 | O | O | O |

---

## 공통 인프라

### 인증 흐름

1. `POST /auth/register` 또는 `/auth/login` → `accessToken`(1h) + `refreshToken`(7d) 발급
2. 요청마다 `Authorization: Bearer {accessToken}` 헤더 필요
3. JWT Strategy: payload `{ sub: guardianId, email }` → `request.user = { id, email }`
4. PetAccountInterceptor가 `PetGuardian.findFirst({ guardianId, status: ACCEPTED })` 로 자동 resolve
5. `request.petAccount`와 `request.petGuardianRole` 자동 설정

### Guards & Decorators

| 이름 | 위치 | 용도 |
|------|------|------|
| `JwtAuthGuard` | `common/guards/` | JWT 인증 확인 |
| `@CurrentGuardian()` | `common/decorators/` | `request.user` 접근 |
| `@CurrentPet()` | `common/decorators/` | `request.petAccount` 접근 |

### Middleware & Interceptors

| 이름 | 용도 |
|------|------|
| `PetAccountMiddleware` | `x-pet-account-id` 헤더로 petAccount resolve (레거시) |
| `PetAccountInterceptor` | PetGuardian 기반 자동 petAccount resolve (글로벌) |
| `HttpExceptionFilter` | 에러 응답 포맷 통일 `{ statusCode, message, timestamp }` |

---

## 모듈별 API 스펙

---

### AUTH 모듈

**Base**: `/api/auth`

#### POST /auth/register
- **인증**: 없음
- **Body**: `{ email, password(@MinLength(6)), name, phone?, inviteCode? }`
- **응답**: `{ guardian: { id, email, name }, accessToken, refreshToken }`
- **에러**: 409(이메일 중복), 400(초대코드 만료)

#### POST /auth/login
- **인증**: 없음
- **Body**: `{ email, password }`
- **응답**: `{ guardian, accessToken, refreshToken }`
- **에러**: 401(인증 실패)

#### POST /auth/refresh
- **인증**: 없음
- **Body**: `{ refreshToken }`
- **응답**: `{ accessToken }`
- **에러**: 401(토큰 무효)

#### GET /auth/invite-code
- **인증**: JwtAuthGuard
- **응답**: `{ inviteCode }` (JWT, 72h 만료)

---

### PET 모듈

**Base**: `/api/pets` | **인증**: 전체 JwtAuthGuard

#### POST /pets
- **Body**: `{ name, species(enum), profileImage, breed?, birthDate?, gender?, bio?, personality?[], favorites?[] }`
- **로직**: 이미 펫 있으면 409. PetAccount + PetGuardian(OWNER, ACCEPTED) 트랜잭션 생성
- **응답**: PetAccount

#### GET /pets/mine
- **응답**: PetAccount | null
- **로직**: `PetGuardian.findFirst({ guardianId, status: ACCEPTED })` → petAccount 반환

#### GET /pets/invitations
- **응답**: PetGuardian[] (PENDING, 본인 대상)

#### POST /pets/invitations/:id/accept
- **로직**: status → ACCEPTED, acceptedAt 설정
- **에러**: 404, 400(이미 처리됨)

#### POST /pets/invitations/:id/reject
- **로직**: PetGuardian 삭제 (재초대 가능)
- **에러**: 404, 400(이미 처리됨)

#### GET /pets/:id
- **응답**: PetAccount + `_count { posts, sentRequests(ACCEPTED), receivedRequests(ACCEPTED) }` + petGuardians[]

#### PATCH /pets/:id
- **권한**: OWNER 또는 ADMIN
- **Body**: `{ name?, profileImage?, breed?, birthDate?, gender?, bio?, personality?[], favorites?[] }`

#### DELETE /pets/:id
- **권한**: OWNER만
- **로직**: CASCADE 삭제

#### POST /pets/:id/guardians/invite
- **권한**: OWNER 또는 ADMIN
- **Body**: `{ email }`
- **로직**: 대상 집사 검색 → 이미 펫 있으면 409 → PetGuardian(MEMBER, PENDING) 생성

#### GET /pets/:id/guardians
- **응답**: PetGuardian[] (ACCEPTED, createdAt ASC)

#### PATCH /pets/:id/guardians/:guardianId/role
- **권한**: OWNER만
- **Body**: `{ role: 'ADMIN' | 'MEMBER' }`
- **제한**: 본인 역할 변경 불가, OWNER 부여 불가

#### DELETE /pets/:id/guardians/:guardianId
- **권한**: OWNER만
- **제한**: 본인 제거 불가

---

### UPLOAD 모듈

**Base**: `/api/upload` | **인증**: JwtAuthGuard

**스토리지**: MinIO S3 호환 (`STORAGE_ENDPOINT`, `STORAGE_BUCKET`)
- 초기화 시 버킷 자동 생성 + public-read 정책 설정
- 이미지: jpeg, png, gif, webp (10MB)
- 동영상: mp4, quicktime (100MB)

#### POST /upload/image
- **Content-Type**: multipart/form-data (`file` 필드)
- **응답**: `{ url }` — `{endpoint}/{bucket}/images/{guardianId}/{uuid}.{ext}`

#### POST /upload/images
- **Content-Type**: multipart/form-data (`files` 필드, 최대 10개)
- **응답**: `{ urls: string[] }`

#### POST /upload/video
- **Content-Type**: multipart/form-data (`file` 필드)
- **응답**: `{ url }` — `{endpoint}/{bucket}/videos/{guardianId}/{uuid}.{ext}`

---

### POST 모듈

**Base**: `/api/posts` | **인증**: JwtAuthGuard + CurrentPet

#### POST /posts
- **Body**: `{ content?, images?[], videos?[], visibility?(PUBLIC|FRIENDS|PRIVATE), geoTag?, latitude?, longitude? }`
- **제한**: content, images, videos 중 하나 이상 필수
- **응답**: Post + petAccount

#### GET /posts/feed
- **Query**: `cursor?` (ISO timestamp), `limit?` (기본 20)
- **응답**: `{ posts: Post[], nextCursor: string | null }`
- **로직**: 본인 + 친구(ACCEPTED) 게시글, PUBLIC/FRIENDS만, createdAt DESC
- **페이징**: cursor 기반 (createdAt < cursor)
- **추가 필드**: `_count { comments, likes }`, `isLiked: boolean`

#### GET /posts/:id
- **응답**: Post + `_count` + `isLiked`

#### POST /posts/:id/like
- **로직**: 토글 (좋아요 ↔ 취소), 트랜잭션으로 Like + likeCount 동기화
- **응답**: `{ liked: boolean, likeCount: number }`

#### POST /posts/:id/comments
- **Body**: `{ content, parentId? }`
- **응답**: Comment + petAccount

#### GET /posts/:id/comments
- **응답**: Comment[] (top-level, 각 replies[] 포함, createdAt ASC)

---

### FRIEND 모듈

**Base**: `/api/friends` | **인증**: JwtAuthGuard + CurrentPet

#### POST /friends/request
- **Body**: `{ receiverId, method?(QR_CODE|NEARBY|SEARCH|RECOMMENDATION) }`
- **에러**: 400(자기 자신), 404(수신자), 409(이미 존재)

#### POST /friends/requests/:id/accept
- **로직**: status → ACCEPTED, acceptedAt 설정
- **제한**: 수신자만 가능

#### POST /friends/requests/:id/reject
- **로직**: status → REJECTED
- **제한**: 수신자만 가능

#### GET /friends
- **응답**: `[{ friendshipId, friend: { id, name, profileImage, species }, method, acceptedAt }]`
- **로직**: 양방향 ACCEPTED 조회, 상대방 정보 반환

#### GET /friends/requests
- **응답**: Friendship[] (PENDING, receiverId = 현재 펫)

#### GET /friends/nearby
- **Query**: `lat`, `lng`, `radius?` (기본 5km)
- **응답**: `[{ id, name, profileImage, species, latitude, longitude, distance }]`
- **로직**: Haversine raw SQL, 최대 50개, 거리순
- **제한**: lat, lng 필수

#### GET /friends/qr-data
- **응답**: `{ petId, petName, profileImage }`

---

### SEARCH 모듈

**Base**: `/api/search` | **인증**: JwtAuthGuard

#### GET /search/pets
- **Query**: `q` (검색어)
- **응답**: `[{ id, name, species, breed, profileImage, bio }]`
- **로직**: name 또는 breed에 대해 case-insensitive contains, 본인 제외, 최대 20개

---

### 미구현 모듈 (Placeholder)

아래 모듈들은 Controller/Service 구조만 있고 TODO 상태입니다.

| 모듈 | Base Path | 구현 상태 |
|------|-----------|-----------|
| User | `/api/users` | getProfile, updateProfile, findOne — 전부 placeholder |
| Story | `/api/stories` | list, create, findOne — placeholder |
| Community | `/api/communities` | list, create, findOne, join — placeholder |
| Walk | `/api/walks` | start, end, findOne, list — placeholder |
| Service | `/api/services` | list, findOne, create — placeholder |
| Haven | `/api/haven` | createHaven, getHaven, addMemory, addCondolence — placeholder |
| Coin | `/api/coins` | getWallet, getTransactions, purchaseHavenItem — placeholder |

---

## 환경 변수

```env
API_PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/pettopia
JWT_SECRET=pettopia-jwt-secret
JWT_REFRESH_SECRET=pettopia-jwt-refresh-secret
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=pettopia
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
```

---

## 빌드 & 실행

```bash
pnpm db:generate      # Prisma 클라이언트 생성
pnpm db:migrate       # DB 마이그레이션
pnpm --filter api dev # 개발 서버 (포트 4000)
```

### 빌드 주의사항
- `tsconfig`: `strictPropertyInitialization: false` (NestJS DTO), `declaration: false` (Prisma 타입 오류 방지)
- `bcrypt`는 native 빌드 필요: `pnpm approve-builds`
- NestJS v11: middleware `forRoutes('*path')` 사용 (`'*'` 아님)
- `.env` 위치: 프로젝트 루트. ConfigModule은 `envFilePath: path.join(__dirname, '..', '..', '..', '.env')`
