# FIRE Tools - 재테크 도구 모음

재테크에 필요한 계산기 모음 웹사이트.

## 도구 목록

| 도구 | 경로 | 설명 |
|------|------|------|
| FIRE 은퇴 계산기 | [외부 링크](https://fire-calculator.streamlit.app) | 자산 추이 시뮬레이션 |
| 연봉 실수령액 계산기 | `/salary` | 4대보험 + 소득세 공제 후 월 실수령액 (2026년 기준) |
| 전월세 전환 계산기 | `/rent-convert` | 전세↔월세 전환 + 투자 수익률 대비 손익 분석 |
| 대출 상환 계산기 | `/loan` | 원리금균등·원금균등·체증식 비교 + 조기상환 손익 분석 |

## 기술 스택

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Recharts (차트)
- Vitest (테스트)

## 시작하기

### 필수 조건

- **Node.js** 18.17 이상 (권장: 20+)
- **npm** 9 이상

Node.js가 설치되어 있지 않다면:

```bash
# macOS (Homebrew)
brew install node

# 또는 nvm으로 설치
nvm install 20
nvm use 20
```

### 설치 및 실행

```bash
# 1. 의존성 설치 (최초 1회, 또는 package.json 변경 시)
npm install

# 2. 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

### 테스트

```bash
# 전체 테스트 실행
npm run test:run

# 워치 모드 (파일 변경 시 자동 재실행)
npm test
```

### 빌드

```bash
npm run build
```

## 프로젝트 구조

```
app/
├── page.tsx                # 허브 페이지 (/)
├── salary/page.tsx         # 연봉 실수령액 계산기
├── rent-convert/page.tsx   # 전월세 전환 계산기
├── loan/page.tsx           # 대출 상환 계산기
├── robots.ts               # SEO
└── sitemap.ts              # SEO

lib/
├── constants.ts            # 2026년 세율/요율 상수
├── format.ts               # 숫자 포맷 유틸
├── salary.ts               # 연봉 실수령액 계산 로직
├── rent-convert.ts         # 전월세 전환 계산 로직
└── loan.ts                 # 대출 상환 계산 로직

__tests__/
├── format.test.ts
├── salary.test.ts
├── rent-convert.test.ts
└── loan.test.ts
```

## 연도 업데이트

매년 세율/요율이 변경되면 `lib/constants.ts`의 값을 업데이트하면 모든 계산기에 반영됩니다.

## 배포

Vercel에 연결하면 `main` 브랜치 push 시 자동 배포됩니다.
