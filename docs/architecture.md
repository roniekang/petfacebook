# Pettopia - 아키텍처 문서

## 전체 아키텍처 개요

Pettopia는 **pnpm 모노레포** 기반의 풀스택 애플리케이션으로, 프론트엔드(Next.js)와 백엔드(NestJS)가 공유 패키지를 통해 타입과 설정을 공유합니다.

```
┌─────────────────────────────────────────────────┐
│                    Client                        │
│              (Browser / Mobile)                  │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────────┐
│              apps/web (Next.js)                   │
│  ┌───────────┐ ┌───────────┐ ┌───────────────┐  │
│  │   Pages   │ │Components │ │  Server-Side   │  │
│  │ (App Dir) │ │    (UI)   │ │  Rendering     │  │
│  └───────────┘ └───────────┘ └───────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │ REST API / WebSocket
┌──────────────────▼──────────────────────────────┐
│              apps/api (NestJS)                    │
│  ┌──────┐ ┌────────┐ ┌───────┐ ┌────────────┐  │
│  │Guards│ │Modules │ │Services│ │ Controllers │  │
│  └──────┘ └────────┘ └───┬───┘ └────────────┘  │
│                          │                       │
│  ┌───────────────────────▼───────────────────┐  │
│  │          Prisma Client (ORM)               │  │
│  └───────────────────────┬───────────────────┘  │
└──────────────────────────┼──────────────────────┘
                           │
┌──────────────────────────▼──────────────────────┐
│              PostgreSQL Database                  │
└─────────────────────────────────────────────────┘
```

---

## 모노레포 구조

```
pettopia/
├── apps/
│   ├── web/                    # Next.js 프론트엔드
│   │   ├── src/
│   │   │   ├── app/            # App Router (페이지)
│   │   │   ├── components/     # UI 컴포넌트
│   │   │   ├── hooks/          # 커스텀 훅
│   │   │   ├── lib/            # 유틸리티, API 클라이언트
│   │   │   ├── stores/         # 상태 관리
│   │   │   └── styles/         # 글로벌 스타일
│   │   ├── public/             # 정적 파일
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                    # NestJS 백엔드
│       ├── src/
│       │   ├── modules/        # 기능 모듈
│       │   │   ├── auth/       # 인증
│       │   │   ├── user/       # 사용자
│       │   │   ├── pet/        # 펫 프로필
│       │   │   ├── post/       # 피드/게시글
│       │   │   ├── story/      # 스토리
│       │   │   ├── friend/     # 친구
│       │   │   ├── community/  # 지역 커뮤니티
│       │   │   ├── walk/       # 산책 모임
│       │   │   ├── service/    # 병원/보험
│       │   │   ├── haven/      # Pet Haven
│       │   │   └── search/     # 검색
│       │   ├── common/         # 공통 (가드, 필터, 인터셉터)
│       │   ├── config/         # 앱 설정
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── test/
│       ├── nest-cli.json
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── database/               # Prisma 스키마 & 클라이언트
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   └── index.ts        # Prisma Client export
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── types/                  # 공유 TypeScript 타입
│   │   ├── src/
│   │   │   ├── user.ts
│   │   │   ├── pet.ts
│   │   │   ├── post.ts
│   │   │   ├── friend.ts
│   │   │   ├── community.ts
│   │   │   ├── haven.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── config/                 # 공유 설정 (ESLint, TS 등)
│       ├── eslint/
│       ├── typescript/
│       └── package.json
│
├── docs/                       # 프로젝트 문서
│   ├── concept.md              # 서비스 컨셉
│   ├── architecture.md         # 아키텍처 (이 문서)
│   ├── spec.md                 # 기능 스펙
│   └── data-model.md           # 데이터 모델
│
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
└── README.md
```

---

## 백엔드 모듈 아키텍처 (NestJS)

각 모듈은 독립적인 도메인 단위로 구성되며, 아래 패턴을 따릅니다:

```
modules/{module-name}/
├── {module-name}.module.ts       # 모듈 정의
├── {module-name}.controller.ts   # REST API 엔드포인트
├── {module-name}.service.ts      # 비즈니스 로직
├── dto/                          # Data Transfer Objects
│   ├── create-{name}.dto.ts
│   └── update-{name}.dto.ts
└── entities/                     # 엔티티 (필요 시)
```

### Phase 1 모듈 목록

| 모듈 | 책임 |
|------|------|
| `auth` | 회원가입, 로그인, JWT 토큰, 소셜 로그인 |
| `user` | 사용자 프로필, Geo IP 기반 지역 설정 |
| `pet` | 펫 등록/수정/삭제, 복수 보호자, 활동 기록 |
| `post` | 게시글 CRUD, 사진 업로드 |
| `story` | 스토리 생성/조회, Geo Tag |
| `friend` | 친구 요청/수락/거절, 지역 기반 추천 |
| `community` | 지역 커뮤니티 CRUD, 소통 |
| `walk` | 산책 모임 생성/참여/관리 |
| `service` | 동물병원, 펫 보험 정보 |
| `haven` | Pet Haven 추모 공간, 메모리 관리 |
| `search` | 통합 검색 (펫, 사용자, 커뮤니티, 서비스) |

---

## 프론트엔드 라우트 구조 (Next.js App Router)

```
app/
├── (auth)/                     # 인증 그룹
│   ├── login/page.tsx
│   └── register/page.tsx
├── (main)/                     # 메인 레이아웃 그룹
│   ├── layout.tsx              # 공통 레이아웃 (네비게이션, 사이드바)
│   ├── feed/page.tsx           # 메인 피드
│   ├── pet/
│   │   ├── [id]/page.tsx       # 펫 프로필
│   │   ├── register/page.tsx   # 펫 등록
│   │   └── activity/page.tsx   # 활동 기록
│   ├── story/page.tsx          # 스토리
│   ├── friends/page.tsx        # 친구 목록
│   ├── community/
│   │   ├── page.tsx            # 커뮤니티 목록
│   │   └── [id]/page.tsx       # 커뮤니티 상세
│   ├── walk/
│   │   ├── page.tsx            # 산책 모임 목록
│   │   └── [id]/page.tsx       # 모임 상세
│   ├── services/
│   │   ├── hospital/page.tsx   # 동물병원
│   │   └── insurance/page.tsx  # 펫 보험
│   ├── haven/
│   │   ├── page.tsx            # Pet Haven 메인
│   │   └── [petId]/page.tsx    # 펫 추모 페이지
│   ├── search/page.tsx         # 검색
│   └── profile/page.tsx        # 내 프로필
└── api/                        # Next.js API Routes (BFF 용도)
```

---

## 통신 방식

| 구간 | 프로토콜 | 용도 |
|------|---------|------|
| Client ↔ Next.js | HTTPS | 페이지 렌더링, 정적 자원 |
| Next.js ↔ NestJS | REST API (HTTP) | 데이터 CRUD |
| Client ↔ NestJS | WebSocket | 실시간 알림, 채팅 (추후) |

---

## 인증 흐름

```
1. 사용자 → POST /auth/register (회원가입)
2. 사용자 → POST /auth/login (로그인)
3. 서버 → JWT Access Token + Refresh Token 발급
4. 이후 요청 → Authorization: Bearer {accessToken}
5. 토큰 만료 → POST /auth/refresh (갱신)
```

---

## 외부 서비스 연동

| 서비스 | 용도 |
|--------|------|
| Geo IP API | 사용자 위치 자동 감지 |
| Cloud Storage (S3 등) | 이미지/동영상 업로드 |
| 소셜 로그인 (OAuth) | Google, Kakao, Naver 등 |
| 지도 API | 산책 경로, 병원 위치 표시 |

---

## Docker 배포 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                  Docker Compose                      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────┐  ┌────────┐ │
│  │   web    │  │   api    │  │  db   │  │ minio  │ │
│  │ (Next.js)│  │(NestJS)  │  │(Pg16) │  │(S3 호환)│ │
│  │ :3000    │  │ :4000    │  │ :5432 │  │:9000   │ │
│  └────┬─────┘  └────┬─────┘  └───┬───┘  └───┬────┘ │
│       │              │            │          │       │
│       │         REST API      Prisma     S3 API     │
│       └──────────────┘            │          │       │
│                                   └──────────┘       │
└─────────────────────────────────────────────────────┘
```

### 컨테이너 구성

| 컨테이너 | 이미지 | 포트 | 용도 |
|----------|--------|------|------|
| `pettopia-web` | Next.js standalone | 3000 | 프론트엔드 (PWA) |
| `pettopia-api` | NestJS | 4000 | 백엔드 API |
| `pettopia-db` | PostgreSQL 16 Alpine | 5432 | 데이터베이스 |
| `pettopia-storage` | MinIO | 9000/9001 | 파일 스토리지 (사진/동영상) |

### 개발 환경
- `docker-compose.dev.yml`: DB + MinIO만 Docker로 실행
- 프론트엔드/백엔드는 로컬에서 `pnpm dev`로 실행

### 프로덕션 환경
- `docker-compose.yml`: 전체 서비스 Docker로 실행
- Next.js standalone 빌드로 경량 이미지 생성

---

## 모바일 지원 전략

### PWA (Progressive Web App)
- 모바일 브라우저에서 앱처럼 설치 가능
- 카메라 접근으로 사진/동영상 촬영 및 업로드
- Geo Tag 자동 추출 (EXIF 메타데이터)
- 오프라인 캐싱 (향후)

### 모바일 최적화
- 반응형 디자인 (모바일 퍼스트)
- 터치 인터페이스 최적화
- 이미지 자동 리사이즈/압축
- `viewport` 설정으로 네이티브 앱 느낌 제공
