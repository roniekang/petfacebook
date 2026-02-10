# Pettopia - 데이터 모델 문서

## 핵심 설계 원칙

> **펫이 주인공입니다.**
> - 계정의 중심은 펫 (Pet)
> - 집사(보호자)는 1개의 펫에 대해 하나의 계정을 생성
> - 모든 소셜 활동(친구, 피드, 커뮤니티)은 펫 단위로 이루어짐
> - 지역 기반 서비스 (Geo IP / Geo Tag)

---

## 계정 구조

```
집사 A ──생성──▶ [펫 계정: 뽀삐] ◀──친구──▶ [펫 계정: 초코]  ◀──생성── 집사 B
                     │                           │
                     ├── 피드 작성                ├── 피드 작성
                     ├── 스토리                   ├── 스토리
                     ├── 산책 기록                ├── 산책 기록
                     └── 커뮤니티 활동            └── 커뮤니티 활동
```

- 집사가 펫 여러 마리를 키우는 경우 → 펫마다 별도 계정 생성
- 로그인 후 펫 계정 간 전환 가능

---

## ER 다이어그램

```
┌──────────────┐     1:N      ┌──────────────┐
│   Guardian   │─────────────▶│  PetAccount  │
│   (집사)      │              │  (펫 계정)    │
└──────────────┘              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
               ┌────▼────┐   ┌──────▼──────┐  ┌─────▼─────┐
               │  Post   │   │  Friendship │  │  Activity  │
               │ (게시글) │   │   (친구)     │  │  (활동)    │
               └────┬────┘   └─────────────┘  └───────────┘
                    │
              ┌─────┼─────┐
              │           │
        ┌─────▼───┐ ┌────▼────┐
        │ Comment │ │  Like   │
        │ (댓글)   │ │ (좋아요) │
        └─────────┘ └─────────┘
```

---

## 테이블 상세

### Guardian (집사/보호자)

집사의 실제 사용자 정보. 인증 및 로그인 주체.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `email` | VARCHAR(255) | 이메일 (고유) |
| `password` | VARCHAR(255) | 해시된 비밀번호 |
| `name` | VARCHAR(100) | 실명 |
| `phone` | VARCHAR(20) | 전화번호 |
| `profileImage` | TEXT | 프로필 이미지 URL |
| `provider` | ENUM | 인증 제공자 (EMAIL, GOOGLE, KAKAO, NAVER) |
| `providerId` | VARCHAR(255) | 소셜 로그인 ID |
| `createdAt` | TIMESTAMP | 생성일 |
| `updatedAt` | TIMESTAMP | 수정일 |

---

### PetAccount (펫 계정) - **서비스의 핵심 엔티티**

펫 = 계정. 모든 소셜 활동의 주체.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `guardianId` | UUID | FK → Guardian (생성한 집사) |
| `name` | VARCHAR(100) | 펫 이름 (닉네임/계정명) |
| `species` | ENUM | 종류 (DOG, CAT, BIRD, RABBIT, HAMSTER, OTHER) |
| `breed` | VARCHAR(100) | 품종 |
| `birthDate` | DATE | 생년월일 |
| `gender` | ENUM | 성별 (MALE, FEMALE, NEUTERED_MALE, SPAYED_FEMALE) |
| `profileImage` | TEXT | 프로필 사진 URL |
| `bio` | TEXT | 소개글 |
| `personality` | VARCHAR(255)[] | 성격 태그 (예: 활발한, 소심한, 친화적) |
| `favorites` | VARCHAR(255)[] | 좋아하는 것 |
| `regionCode` | VARCHAR(20) | 지역 코드 |
| `regionName` | VARCHAR(100) | 지역명 (예: 서울시 강남구 역삼동) |
| `latitude` | DECIMAL | 위도 |
| `longitude` | DECIMAL | 경도 |
| `status` | ENUM | 상태 (ACTIVE, HAVEN) |
| `havenDate` | DATE | Pet Haven 전환일 (사망일) |
| `createdAt` | TIMESTAMP | 생성일 |
| `updatedAt` | TIMESTAMP | 수정일 |

---

### Friendship (펫 친구 관계)

펫과 펫 사이의 친구 관계. 집사가 폰 앱을 통해 추가.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `requesterId` | UUID | FK → PetAccount (요청한 펫) |
| `receiverId` | UUID | FK → PetAccount (받는 펫) |
| `status` | ENUM | 상태 (PENDING, ACCEPTED, REJECTED) |
| `method` | ENUM | 추가 방식 (QR_CODE, NEARBY, SEARCH, RECOMMENDATION) |
| `createdAt` | TIMESTAMP | 요청일 |
| `acceptedAt` | TIMESTAMP | 수락일 |

---

### Post (게시글)

펫 계정이 작성하는 피드 게시글.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `petAccountId` | UUID | FK → PetAccount (작성 펫) |
| `content` | TEXT | 게시글 내용 |
| `images` | TEXT[] | 이미지 URL 배열 |
| `visibility` | ENUM | 공개 범위 (PUBLIC, FRIENDS, PRIVATE) |
| `geoTag` | VARCHAR(100) | 위치 태그 |
| `latitude` | DECIMAL | 위도 |
| `longitude` | DECIMAL | 경도 |
| `likeCount` | INTEGER | 좋아요 수 (캐시) |
| `commentCount` | INTEGER | 댓글 수 (캐시) |
| `createdAt` | TIMESTAMP | 생성일 |
| `updatedAt` | TIMESTAMP | 수정일 |

---

### Comment (댓글)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `postId` | UUID | FK → Post |
| `petAccountId` | UUID | FK → PetAccount (작성 펫) |
| `content` | TEXT | 댓글 내용 |
| `parentId` | UUID | FK → Comment (대댓글) |
| `createdAt` | TIMESTAMP | 생성일 |

---

### Like (좋아요)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `postId` | UUID | FK → Post |
| `petAccountId` | UUID | FK → PetAccount |
| `createdAt` | TIMESTAMP | 생성일 |
| **UNIQUE** | | (postId, petAccountId) |

---

### Story (스토리)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `petAccountId` | UUID | FK → PetAccount |
| `mediaUrl` | TEXT | 미디어 URL (사진/동영상) |
| `mediaType` | ENUM | 미디어 타입 (IMAGE, VIDEO) |
| `effectType` | VARCHAR(50) | 적용된 효과 |
| `geoTag` | VARCHAR(100) | 위치 태그 |
| `expiresAt` | TIMESTAMP | 만료 시각 (생성 후 24시간) |
| `createdAt` | TIMESTAMP | 생성일 |

---

### Activity (활동 기록)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `petAccountId` | UUID | FK → PetAccount |
| `type` | ENUM | 활동 유형 (WALK, PLAY, HEALTH, MEAL) |
| `title` | VARCHAR(200) | 활동 제목 |
| `description` | TEXT | 상세 설명 |
| `duration` | INTEGER | 소요 시간 (분) |
| `distance` | DECIMAL | 거리 (km, 산책 시) |
| `routePath` | JSONB | 경로 좌표 배열 (산책 시) |
| `latitude` | DECIMAL | 위도 |
| `longitude` | DECIMAL | 경도 |
| `createdAt` | TIMESTAMP | 생성일 |

---

### Community (지역 커뮤니티)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `name` | VARCHAR(200) | 커뮤니티 이름 |
| `description` | TEXT | 설명 |
| `regionCode` | VARCHAR(20) | 지역 코드 |
| `regionName` | VARCHAR(100) | 지역명 |
| `coverImage` | TEXT | 커버 이미지 URL |
| `memberCount` | INTEGER | 멤버 수 (캐시) |
| `createdBy` | UUID | FK → PetAccount (생성자) |
| `createdAt` | TIMESTAMP | 생성일 |

---

### CommunityMember (커뮤니티 멤버)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `communityId` | UUID | FK → Community |
| `petAccountId` | UUID | FK → PetAccount |
| `role` | ENUM | 역할 (ADMIN, MEMBER) |
| `joinedAt` | TIMESTAMP | 가입일 |

---

### WalkMeetup (산책 모임)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `title` | VARCHAR(200) | 모임 제목 |
| `description` | TEXT | 설명 |
| `hostId` | UUID | FK → PetAccount (주최자) |
| `meetDate` | TIMESTAMP | 모임 일시 |
| `meetPoint` | VARCHAR(200) | 만남 장소 |
| `latitude` | DECIMAL | 위도 |
| `longitude` | DECIMAL | 경도 |
| `maxParticipants` | INTEGER | 최대 참여자 수 |
| `currentParticipants` | INTEGER | 현재 참여자 수 |
| `status` | ENUM | 상태 (UPCOMING, ONGOING, COMPLETED, CANCELLED) |
| `createdAt` | TIMESTAMP | 생성일 |

---

### WalkParticipant (산책 참여자)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `walkMeetupId` | UUID | FK → WalkMeetup |
| `petAccountId` | UUID | FK → PetAccount |
| `status` | ENUM | 상태 (PENDING, APPROVED, REJECTED) |
| `joinedAt` | TIMESTAMP | 참여일 |

---

### Hospital (동물병원)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `name` | VARCHAR(200) | 병원 이름 |
| `address` | TEXT | 주소 |
| `phone` | VARCHAR(20) | 전화번호 |
| `regionCode` | VARCHAR(20) | 지역 코드 |
| `latitude` | DECIMAL | 위도 |
| `longitude` | DECIMAL | 경도 |
| `specialties` | VARCHAR(100)[] | 진료 분야 |
| `openingHours` | JSONB | 영업시간 |
| `rating` | DECIMAL | 평균 평점 |
| `reviewCount` | INTEGER | 리뷰 수 |

---

### Insurance (펫 보험)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `providerName` | VARCHAR(200) | 보험사 이름 |
| `productName` | VARCHAR(200) | 상품명 |
| `description` | TEXT | 보장 내용 |
| `monthlyPrice` | DECIMAL | 월 보험료 |
| `coverageAmount` | DECIMAL | 보장 금액 |
| `targetSpecies` | ENUM[] | 대상 동물 종류 |
| `externalUrl` | TEXT | 외부 링크 |

---

### HavenMemorial (Pet Haven 추모)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `petAccountId` | UUID | FK → PetAccount (UNIQUE) |
| `tributeMessage` | TEXT | 보호자의 추모 메시지 |
| `coverImage` | TEXT | 추모 페이지 커버 이미지 |
| `createdAt` | TIMESTAMP | 생성일 |

---

### HavenMemory (Happy 메모리)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `memorialId` | UUID | FK → HavenMemorial |
| `mediaUrl` | TEXT | 사진/영상 URL |
| `mediaType` | ENUM | 미디어 타입 (IMAGE, VIDEO) |
| `caption` | TEXT | 설명 |
| `memoryDate` | DATE | 추억 날짜 |
| `createdAt` | TIMESTAMP | 생성일 |

---

### HavenTribute (추모 메시지)

다른 사용자가 남기는 추모 메시지.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `memorialId` | UUID | FK → HavenMemorial |
| `petAccountId` | UUID | FK → PetAccount (작성자) |
| `message` | TEXT | 추모 메시지 |
| `createdAt` | TIMESTAMP | 생성일 |

---

### Region (지역 정보)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `code` | VARCHAR(20) | PK (지역 코드) |
| `name` | VARCHAR(100) | 지역명 |
| `level` | ENUM | 레벨 (PROVINCE, CITY, DISTRICT) |
| `parentCode` | VARCHAR(20) | FK → Region (상위 지역) |
| `latitude` | DECIMAL | 중심 위도 |
| `longitude` | DECIMAL | 중심 경도 |

---

### CoinWallet (코인 지갑)

각 펫 계정이 보유한 Pettopia 코인 지갑.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `petAccountId` | UUID | FK → PetAccount (UNIQUE) |
| `balance` | DECIMAL | 현재 코인 잔액 |
| `totalReceived` | DECIMAL | 총 수령 코인 |
| `totalSpent` | DECIMAL | 총 사용 코인 |
| `updatedAt` | TIMESTAMP | 마지막 갱신일 |

---

### CoinTransaction (코인 거래 내역)

조의금 수령, 아이템 구매 등 코인 거래 기록.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `walletId` | UUID | FK → CoinWallet |
| `type` | ENUM | 거래 유형 (CONDOLENCE_RECEIVED, ITEM_PURCHASE, REFUND) |
| `amount` | DECIMAL | 금액 |
| `direction` | ENUM | 방향 (IN, OUT) |
| `referenceId` | UUID | 관련 엔티티 ID (조의금 ID 또는 아이템 구매 ID) |
| `description` | TEXT | 거래 설명 |
| `createdAt` | TIMESTAMP | 거래일 |

---

### Condolence (조의금)

펫이 무지개 다리를 건넌 경우 친구들이 보내는 조의금.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `senderId` | UUID | FK → PetAccount (보내는 펫 계정) |
| `memorialId` | UUID | FK → HavenMemorial (받는 추모관) |
| `amount` | DECIMAL | 조의금 금액 (→ Pettopia 코인으로 전환) |
| `message` | TEXT | 조의 메시지 |
| `createdAt` | TIMESTAMP | 전송일 |

---

### HavenShopItem (추모관 꾸미기 아이템)

추모관을 꾸밀 수 있는 아이템 카탈로그.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `name` | VARCHAR(200) | 아이템 이름 |
| `description` | TEXT | 아이템 설명 |
| `category` | ENUM | 카테고리 (BACKGROUND, DECORATION, FLOWER, CANDLE, FRAME, MUSIC) |
| `imageUrl` | TEXT | 아이템 미리보기 이미지 |
| `price` | DECIMAL | 가격 (Pettopia 코인) |
| `isActive` | BOOLEAN | 활성 여부 |
| `createdAt` | TIMESTAMP | 생성일 |

---

### HavenItemPurchase (추모관 아이템 구매)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | PK |
| `memorialId` | UUID | FK → HavenMemorial |
| `itemId` | UUID | FK → HavenShopItem |
| `petAccountId` | UUID | FK → PetAccount (구매자) |
| `price` | DECIMAL | 구매 당시 가격 |
| `isApplied` | BOOLEAN | 추모관에 적용 여부 |
| `createdAt` | TIMESTAMP | 구매일 |

---

## 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| PetAccount | `(regionCode)` | 지역 기반 검색 |
| PetAccount | `(guardianId)` | 집사의 펫 조회 |
| PetAccount | `(latitude, longitude)` | 근처 펫 검색 |
| Post | `(petAccountId, createdAt DESC)` | 피드 조회 |
| Friendship | `(requesterId, status)` | 친구 목록 |
| Friendship | `(receiverId, status)` | 친구 요청 목록 |
| Activity | `(petAccountId, type, createdAt)` | 활동 기록 조회 |
| Story | `(petAccountId, expiresAt)` | 활성 스토리 조회 |
