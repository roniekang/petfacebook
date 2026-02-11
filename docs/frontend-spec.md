# Pettopia Frontend - 개발 스펙 문서

> 실제 구현된 프론트엔드 스펙을 기술합니다. 기획 스펙(`spec.md`)과 달리 현재 코드 기준의 구현 상태를 반영합니다.

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 15.1.0 (App Router) |
| React | 19.0.0 |
| 상태 관리 | Zustand 5 |
| 스타일 | Tailwind CSS 4.0 |
| 아이콘 | react-icons (Ionicons 5) |
| 날짜 | date-fns (Korean locale) |
| QR | qrcode.react |
| 빌드 | Standalone (Docker 지원) |
| PWA | manifest.json (standalone display) |

---

## 디자인 시스템

- **Primary Color**: Orange (#f97316 계열, 50~700)
- **Typography**: Apple system fonts + Roboto 폴백
- **Background**: #fafafa
- **Border Radius**: rounded-xl (카드), rounded-full (아바타/버튼)
- **모바일 퍼스트**: max-width 512px, 고정 상단/하단 네비게이션, 터치 최적화

---

## 인증 흐름

### AuthProvider (`components/providers/auth-provider.tsx`)

1. 마운트 시 `useAuthStore.hydrate()` — localStorage에서 guardian + token 복원
2. 미인증 + 비공개 경로 → `/login` 리다이렉트
3. 인증됨 + 인증 경로(`/login`, `/register`) → `/feed` 리다이렉트
4. 인증됨 → `fetchMyPet()` 호출하여 petStore 갱신

### 공개 경로
- `/login`, `/register`, `/`

### 펫 설정 경로 (인증 필요, 펫 없어도 접근 가능)
- `/pet/register`, `/invitations`

---

## API 클라이언트 (`lib/api-client.ts`)

- **Base URL**: `NEXT_PUBLIC_API_URL` (기본: `http://localhost:4000`)
- JWT Bearer 토큰 자동 주입
- 401 시 refresh token으로 자동 갱신 → 실패 시 `/login` 리다이렉트
- FormData 지원 (파일 업로드 시 Content-Type 생략)

---

## 상태 관리 (Zustand Stores)

### auth-store

| 상태 | 타입 | 설명 |
|------|------|------|
| `guardian` | Guardian \| null | 현재 로그인한 집사 |
| `isAuthenticated` | boolean | 인증 상태 |
| `isLoading` | boolean | 하이드레이션 로딩 |

| 액션 | 설명 |
|------|------|
| `login(email, password)` | 로그인 → 토큰/guardian 저장 |
| `register(email, password, name)` | 회원가입 → 토큰/guardian 저장 |
| `logout()` | 토큰 삭제, `/login` 이동 |
| `hydrate()` | localStorage에서 복원 |

### pet-store

| 상태 | 타입 | 설명 |
|------|------|------|
| `pet` | PetAccount \| null | 현재 활성 펫 |
| `isLoading` | boolean | 로딩 상태 |

| 액션 | 설명 |
|------|------|
| `fetchMyPet()` | `GET /api/pets/mine` → pet 설정 |
| `setPet(pet)` | 직접 설정 (등록/수정 후) |
| `clear()` | pet = null 초기화 |

---

## 레이아웃 구조

### Root Layout (`app/layout.tsx`)
- HTML lang="ko", PWA 메타데이터, AuthProvider 래핑

### Main Layout (`app/(main)/layout.tsx`)
- 고정 상단 TopNav + 고정 하단 BottomTabs
- 컨텐츠: max-w-lg(512px), pt-14, pb-16

### TopNav (`components/layout/top-nav.tsx`)
- 좌: 라우트별 동적 타이틀 (피드 → "Pettopia" 로고)
- 우: PetSelector + 검색 아이콘

### BottomTabs (`components/layout/bottom-tabs.tsx`)
- 홈(`/feed`) | 친구(`/friends`) | 글쓰기(`/posts/new`) | 내 펫(`/pet/:id`)
- 활성 탭 오렌지 하이라이팅
- "내 펫" 탭은 프로필 이미지 표시

### PetSelector (`components/layout/pet-selector.tsx`)
- 펫 있음: 아바타 + 이름 (프로필 링크)
- 펫 없음: "펫 등록" 버튼

---

## 페이지 상세

---

### 홈 피드 (`/feed`)

**3-Layer 구조** (Facebook 스타일):

#### Layer 1: 게시물 작성 카드
- 펫 프로필 사진 + placeholder 텍스트 `"[펫이름]의 이야기를 공유해보세요..."`
- 사진/동영상 버튼 (아이콘)
- 클릭 시 `/posts/new`로 이동

#### Layer 2: 친구 카드 (가로 스크롤)
- 맨 앞: "친구 추가" 카드 (점선 원형, `IoPersonAddOutline`) → `/friends/add`
- 친구 프로필 원형 아바타 + 이름 (16x16, ring-2 orange)
- 좌우 스크롤, `scrollbar-hide` 적용
- 친구 없으면 안내 문구

#### Layer 3: 피드 (무한 스크롤)
- PostCard 컴포넌트로 렌더링
- cursor 기반 페이징 (limit 10)
- IntersectionObserver (threshold 0.5)로 자동 추가 로드
- 게시글 없으면 빈 상태 + "글 쓰기" 버튼

**API 호출**:
- `GET /api/posts/feed?cursor=X&limit=10`
- `GET /api/friends`

---

### 친구 목록 (`/friends`)

**2-Tab 구조**:

#### 친구 탭
- 친구 리스트: 아바타 + 이름 + 종(speciesLabel 변환)
- 클릭 → `/pet/:id`
- 비어있으면 `IoPersonAddOutline` + 안내

#### 요청 탭
- 받은 친구 요청 목록
- 수락(체크) / 거절(X) 버튼
- 요청 있으면 탭에 빨간 뱃지
- 수락 시 친구 목록 새로고침

**헤더**: 우측 "친구 추가" 버튼 → `/friends/add`

**API 호출**:
- `GET /api/friends`
- `GET /api/friends/requests`
- `POST /api/friends/requests/:id/accept`
- `POST /api/friends/requests/:id/reject`

---

### 친구 추가 (`/friends/add`)

**3-Tab 구조**:

#### 검색 탭
- 실시간 텍스트 검색 (debounce 300ms)
- 이름/품종 검색 결과 카드
- "친구 요청" 버튼 (전송 후 비활성화)
- API: `GET /api/search/pets?q=`

#### 근처 탭
- 브라우저 위치 권한 요청
- "주변 탐색하기" 버튼 → 10km 반경 검색
- 거리 표시 (m/km)
- API: `GET /api/friends/nearby?lat=&lng=&radius=10`

#### QR 탭
- "내 QR 코드" / "QR 입력" 토글
- QR 표시: `QRCodeSVG`로 펫 정보 JSON 렌더링
- QR 입력: 텍스트 필드에 QR 데이터 또는 펫 ID 입력
- 스캔된 펫 프로필 표시 후 친구 요청

**공통 API**: `POST /api/friends/request`

---

### 집사 초대 수락 (`/invitations`)

- 받은 펫 집사 초대 목록
- 펫 프로필 이미지, 이름, 초대자 이름 표시
- 수락(체크) / 거절(X) 버튼
- 수락 시 petStore 갱신 → `/feed` 이동

**API 호출**:
- `GET /api/pets/invitations`
- `POST /api/pets/invitations/:id/accept`
- `POST /api/pets/invitations/:id/reject`

---

### 펫 등록 (`/pet/register`)

- 이미 펫 있으면 `/feed`로 리다이렉트
- **필수**: 프로필 이미지, 이름, 종류
- **종류 선택**: 8종 이모지 그리드 (DOG, CAT, BIRD, RABBIT, HAMSTER, FISH, REPTILE, OTHER)
- **성별 선택**: 4종 그리드 (MALE, FEMALE, NEUTERED_MALE, SPAYED_FEMALE)
- **선택**: 품종, 생년월일, 소개글
- 이미지 업로드 시 스피너 오버레이

**API 호출**:
- `POST /api/upload/image`
- `POST /api/pets`

---

### 펫 프로필 (`/pet/:id`)

**구성**:
1. **프로필 헤더**: 아바타(80x80), 통계(게시글/친구/집사 수), 이름, 종 뱃지, 품종, 소개, 성격 태그
2. **액션 버튼**: 본인 → "프로필 편집", 타인 → "친구 요청"
3. **집사 관리** (접기/펼치기):
   - 집사 목록 (역할 뱃지: OWNER/ADMIN/MEMBER)
   - OWNER/ADMIN: 이메일로 집사 초대 폼
   - OWNER: 역할 변경 드롭다운, 집사 제거 버튼
4. **게시글 그리드** (탭)

**API 호출**:
- `GET /api/pets/:id`
- `POST /api/pets/:id/guardians/invite`
- `PATCH /api/pets/:id/guardians/:guardianId/role`
- `DELETE /api/pets/:id/guardians/:guardianId`
- `POST /api/friends/request`

---

### 펫 프로필 편집 (`/pet/:id/edit`)

- 기존 펫 데이터 로드 후 편집
- **필드**: 프로필 이미지, 이름, 품종, 성별, 생년월일, 소개, 성격(쉼표 구분), 좋아하는 것(쉼표 구분)
- 이미지 변경 시 업로드 후 URL 교체
- 저장 시 petStore도 갱신

**API 호출**:
- `GET /api/pets/:id`
- `POST /api/upload/image`
- `PATCH /api/pets/:id`

---

### 게시글 작성 (`/posts/new`)

- 헤더: 뒤로가기 + "공유" 버튼
- 작성자 정보 (펫 아바타 + 이름)
- 텍스트 영역 + 이미지 프리뷰 그리드 (3열, 제거 가능)
- 하단 "사진 추가" 버튼 (다중 이미지 업로드)
- content 또는 images 중 하나 이상 필수

**API 호출**:
- `POST /api/upload/images`
- `POST /api/posts`

---

### 게시글 상세 (`/posts/:id`)

- PostCard 컴포넌트로 게시글 표시
- 댓글 섹션: 개수 + 목록 (대댓글 중첩)
- 하단 고정 댓글 입력 (Enter 전송)
- 시간: date-fns `formatDistanceToNow` (Korean locale)

**API 호출**:
- `GET /api/posts/:id`
- `GET /api/posts/:id/comments`
- `POST /api/posts/:id/comments`

---

### 로그인 (`/login`)

- 이메일 + 비밀번호 폼
- 클라이언트 유효성 검사
- 에러 메시지 표시
- 회원가입 링크
- 성공 시 `/feed`

---

### 회원가입 (`/register`)

- 이름 + 이메일 + 비밀번호 + 비밀번호 확인
- 비밀번호 일치 검사
- 성공 시 `/pet/register` (첫 펫 등록 유도)

---

## 컴포넌트

### PostCard (`components/post/post-card.tsx`)

**구성**:
1. 헤더: 펫 아바타 + 이름 + 시간 + 더보기(...)
2. 이미지 캐러셀: 다중 이미지 + 좌우 네비게이션 + dots 인디케이터 + 카운터 뱃지
3. 액션: 좋아요(하트, 토글 시 빨간색) + 댓글
4. 좋아요 수, 본문, 댓글 수

**Props**: `post: PostData`, `onCommentClick?: (id) => void`
**로직**: Optimistic 좋아요 상태, 에러 시 롤백

---

## 미구현 페이지 (디렉토리만 존재)

| 경로 | 기능 |
|------|------|
| `/community` | 지역 커뮤니티 |
| `/haven` | Pet Haven 추모 |
| `/profile` | 마이페이지/설정 |
| `/search` | 통합 검색 |
| `/services/hospital` | 동물병원 |
| `/services/insurance` | 펫 보험 |
| `/story` | 스토리 |
| `/walk` | 산책 추적 |

---

## 미구현 컴포넌트 (디렉토리만 존재)

- `components/friend/`
- `components/haven/`
- `components/pet/`
- `components/story/`
- `components/ui/`
- `hooks/` (커스텀 훅 없음)

---

## 빌드 & 실행

```bash
pnpm --filter web dev    # 개발 서버 (포트 3000)
pnpm --filter web build  # 프로덕션 빌드 (standalone)
```

### 설정
- `NEXT_PUBLIC_API_URL`: 백엔드 API 주소 (기본 `http://localhost:4000`)
- 이미지 도메인: `localhost:9000` (MinIO), `*.amazonaws.com`
- 경로 별칭: `@/*` → `./src/*`
- 트랜스파일: `@pettopia/types` (workspace 패키지)
