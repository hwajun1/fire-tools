# fire-tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** FIRE 관련 재테크 웹 도구 모음 사이트 — 허브 페이지 + 연봉 실수령액/전월세 전환/대출 상환 계산기 3종

**Architecture:** Next.js App Router 단일 앱. 계산 로직은 `lib/`에 순수 함수로 분리하여 테스트하고, 각 페이지는 `"use client"` 컴포넌트로 입력 → 즉시 결과 반영. shadcn/ui로 UI, Recharts로 차트.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Vitest, Vercel

---

## File Structure

```
fire-tools/
├── app/
│   ├── layout.tsx              # 공통 레이아웃 + 애드센스 자리
│   ├── page.tsx                # 허브 페이지
│   ├── salary/page.tsx         # 연봉 실수령액
│   ├── rent-convert/page.tsx   # 전월세 전환
│   ├── loan/page.tsx           # 대출 상환
│   ├── robots.ts               # robots.txt 생성
│   └── sitemap.ts              # sitemap.xml 생성
├── components/
│   ├── ui/                     # shadcn/ui (자동 생성)
│   ├── tool-card.tsx           # 허브 도구 카드
│   ├── year-badge.tsx          # "2026년 기준" 배지
│   └── ad-slot.tsx             # 애드센스 슬롯 플레이스홀더
├── lib/
│   ├── constants.ts            # 연도별 세율/요율 상수
│   ├── format.ts               # 숫자 포맷 유틸
│   ├── salary.ts               # 연봉 실수령액 계산
│   ├── rent-convert.ts         # 전월세 전환 계산
│   └── loan.ts                 # 대출 상환 계산
├── __tests__/
│   ├── salary.test.ts
│   ├── rent-convert.test.ts
│   └── loan.test.ts
└── public/
    └── og/                     # OG 이미지 (추후)
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `vitest.config.ts`, etc. (via CLI)

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/hwajunkoo/work/kakao/fire-tools
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Answer prompts: Yes to all defaults.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install recharts
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

Add to `package.json` scripts:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Install shadcn/ui and base components**

```bash
npx shadcn@latest init
```

Choose: New York style, Zinc color, CSS variables: yes.

Then install needed components:

```bash
npx shadcn@latest add card input label select slider table badge separator
```

- [ ] **Step 5: Verify setup**

```bash
npm run dev
# Should start at localhost:3000 with default Next.js page
npm run test:run
# Should run with 0 tests
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Tailwind, shadcn/ui, Vitest"
```

---

### Task 2: Constants and Format Utilities

**Files:**
- Create: `lib/constants.ts`, `lib/format.ts`
- Test: `__tests__/format.test.ts`

- [ ] **Step 1: Write format utility tests**

Create `__tests__/format.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatMoney, formatPercent } from "@/lib/format";

describe("formatMoney", () => {
  it("formats 만원 under 1억", () => {
    expect(formatMoney(5000)).toBe("5,000만원");
  });

  it("formats 억원 at 1억+", () => {
    expect(formatMoney(10000)).toBe("1.0억원");
  });

  it("formats 억원 with decimals", () => {
    expect(formatMoney(25000)).toBe("2.5억원");
  });

  it("formats 0", () => {
    expect(formatMoney(0)).toBe("0만원");
  });
});

describe("formatPercent", () => {
  it("formats ratio as percent", () => {
    expect(formatPercent(0.851)).toBe("85.1%");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- __tests__/format.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create constants**

Create `lib/constants.ts`:

```ts
export const YEAR = 2026;

// 4대보험 요율 (2026년 기준, 근로자 부담분)
export const NATIONAL_PENSION_RATE = 0.045;
export const NATIONAL_PENSION_MONTHLY_CAP = 590; // 만원 (기준소득월액 상한)
export const HEALTH_INSURANCE_RATE = 0.03545;
export const LONG_TERM_CARE_RATE = 0.1295; // 건강보험료의 12.95%
export const EMPLOYMENT_INSURANCE_RATE = 0.009;

// 소득세 과세표준 구간 (만원 단위)
export const TAX_BRACKETS = [
  { limit: 1400, rate: 0.06, deduction: 0 },
  { limit: 5000, rate: 0.15, deduction: 126 },
  { limit: 8800, rate: 0.24, deduction: 576 },
  { limit: 15000, rate: 0.35, deduction: 1544 },
  { limit: 30000, rate: 0.38, deduction: 1994 },
  { limit: 50000, rate: 0.40, deduction: 2594 },
  { limit: 100000, rate: 0.42, deduction: 3594 },
  { limit: Infinity, rate: 0.45, deduction: 6594 },
];

// 근로소득공제 구간 (만원 단위)
export const EARNED_INCOME_DEDUCTION_BRACKETS = [
  { limit: 500, rate: 0.70, base: 0 },
  { limit: 1500, rate: 0.40, base: 350 },
  { limit: 4500, rate: 0.15, base: 750 },
  { limit: 10000, rate: 0.05, base: 1200 },
  { limit: Infinity, rate: 0.02, base: 1475 },
];

// 전월세 전환율 (2026년 한국은행 기준)
export const DEFAULT_RENT_CONVERSION_RATE = 2.5;

// 기본 투자 수익률
export const DEFAULT_INVESTMENT_RETURN_RATE = 4.0;
```

- [ ] **Step 4: Create format utilities**

Create `lib/format.ts`:

```ts
/** 만원 단위 금액을 읽기 쉬운 문자열로 변환 */
export function formatMoney(manwon: number): string {
  if (manwon >= 10000) {
    const eok = manwon / 10000;
    return `${eok.toFixed(1)}억원`;
  }
  return `${manwon.toLocaleString()}만원`;
}

/** 비율(0~1)을 퍼센트 문자열로 변환 */
export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test:run -- __tests__/format.test.ts
```

Expected: PASS (all 5 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/constants.ts lib/format.ts __tests__/format.test.ts
git commit -m "feat: add 2026 tax/insurance constants and format utilities"
```

---

### Task 3: Common Components and Layout

**Files:**
- Create: `components/tool-card.tsx`, `components/year-badge.tsx`, `components/ad-slot.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create year-badge component**

Create `components/year-badge.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { YEAR } from "@/lib/constants";

export function YearBadge() {
  return (
    <Badge variant="secondary" className="text-sm">
      {YEAR}년 기준
    </Badge>
  );
}
```

- [ ] **Step 2: Create tool-card component**

Create `components/tool-card.tsx`:

```tsx
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface ToolCardProps {
  title: string;
  description: string;
  href: string;
  external?: boolean;
}

export function ToolCard({ title, description, href, external }: ToolCardProps) {
  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <Link href={href}>{content}</Link>;
}
```

- [ ] **Step 3: Create ad-slot placeholder**

Create `components/ad-slot.tsx`:

```tsx
/**
 * 애드센스 광고 슬롯 플레이스홀더.
 * 실제 연동 시 주석을 해제하고 data-ad-slot을 채운다.
 */
export function AdSlot({ className }: { className?: string }) {
  return (
    <div className={className}>
      {/* 
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXX"
        data-ad-slot="XXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      */}
    </div>
  );
}
```

- [ ] **Step 4: Update layout.tsx**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "재테크 도구 모음 | FIRE Tools",
    template: "%s | FIRE Tools",
  },
  description: "연봉 실수령액, 전월세 전환, 대출 상환 계산기 등 재테크에 필요한 도구 모음",
  keywords: ["재테크", "계산기", "연봉 실수령액", "전월세 전환", "대출 상환", "FIRE"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      {/* 애드센스 스크립트 — 연동 시 주석 해제
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX"
          crossOrigin="anonymous"
        />
      </head>
      */}
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <a href="/" className="text-xl font-bold">FIRE Tools</a>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8 flex-1">
            {children}
          </main>
          <footer className="border-t">
            <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
              계산 결과는 참고용이며 실제와 차이가 있을 수 있습니다.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify dev server runs**

```bash
npm run dev
```

Visit `localhost:3000` — should show layout with header/footer.

- [ ] **Step 6: Commit**

```bash
git add components/ app/layout.tsx
git commit -m "feat: add common components (tool-card, year-badge, ad-slot) and layout"
```

---

### Task 4: Hub Page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Create hub page**

Replace `app/page.tsx`:

```tsx
import { ToolCard } from "@/components/tool-card";

const tools = [
  {
    title: "FIRE 은퇴 계산기",
    description: "나는 몇 년 뒤에 은퇴할 수 있을까? 자산 추이 시뮬레이션",
    href: "https://fire-calculator.streamlit.app",
    external: true,
  },
  {
    title: "연봉 실수령액 계산기",
    description: "4대보험 + 소득세 공제 후 실제 수령액 계산",
    href: "/salary",
  },
  {
    title: "전월세 전환 계산기",
    description: "전세↔월세 전환 금액 및 손익 분석",
    href: "/rent-convert",
  },
  {
    title: "대출 상환 계산기",
    description: "원리금균등·원금균등·체증식 비교 + 조기상환 분석",
    href: "/loan",
  },
];

export default function Home() {
  return (
    <section>
      <h1 className="text-2xl font-bold mb-6">재테크 도구 모음</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <ToolCard key={tool.href} {...tool} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Visit `localhost:3000` — 4개 카드가 그리드로 표시되어야 함. FIRE 계산기 클릭 시 외부 링크, 나머지는 내부 링크.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add hub page with tool cards"
```

---

### Task 5: Salary Calculation Logic

**Files:**
- Create: `lib/salary.ts`
- Test: `__tests__/salary.test.ts`

- [ ] **Step 1: Write tests**

Create `__tests__/salary.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { calculateSalary, calculateSalaryTable } from "@/lib/salary";

describe("calculateSalary", () => {
  it("calculates net salary for 5000만원 annual, 1 dependent", () => {
    const result = calculateSalary({
      annualSalary: 5000,
      monthlyTaxFree: 20,
      dependents: 1,
      childrenUnder20: 0,
    });

    expect(result.monthlySalary).toBeCloseTo(5000 / 12, 0);
    expect(result.nationalPension).toBeGreaterThan(0);
    expect(result.healthInsurance).toBeGreaterThan(0);
    expect(result.longTermCare).toBeGreaterThan(0);
    expect(result.employmentInsurance).toBeGreaterThan(0);
    expect(result.incomeTax).toBeGreaterThan(0);
    expect(result.localIncomeTax).toBeCloseTo(result.incomeTax * 0.1, 0);
    expect(result.totalDeduction).toBe(
      result.nationalPension +
      result.healthInsurance +
      result.longTermCare +
      result.employmentInsurance +
      result.incomeTax +
      result.localIncomeTax
    );
    expect(result.netSalary).toBe(result.monthlySalary - result.totalDeduction);
  });

  it("caps national pension at monthly income cap", () => {
    const result = calculateSalary({
      annualSalary: 15000,
      monthlyTaxFree: 20,
      dependents: 1,
      childrenUnder20: 0,
    });

    // 월 소득이 590만원 상한을 초과하므로 연금은 590 * 4.5%로 고정
    expect(result.nationalPension).toBeCloseTo(590 * 0.045, 0);
  });

  it("returns zero deductions for very low salary", () => {
    const result = calculateSalary({
      annualSalary: 100,
      monthlyTaxFree: 20,
      dependents: 1,
      childrenUnder20: 0,
    });

    expect(result.incomeTax).toBeGreaterThanOrEqual(0);
    expect(result.netSalary).toBeGreaterThan(0);
  });
});

describe("calculateSalaryTable", () => {
  it("returns rows from 5000 to 15000 in 500 steps", () => {
    const table = calculateSalaryTable();
    expect(table).toHaveLength(21); // 5000, 5500, ..., 15000
    expect(table[0].annualSalary).toBe(5000);
    expect(table[20].annualSalary).toBe(15000);
  });

  it("each row has netSalary > 0", () => {
    const table = calculateSalaryTable();
    table.forEach((row) => {
      expect(row.netSalary).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- __tests__/salary.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement salary calculation**

Create `lib/salary.ts`:

```ts
import {
  NATIONAL_PENSION_RATE,
  NATIONAL_PENSION_MONTHLY_CAP,
  HEALTH_INSURANCE_RATE,
  LONG_TERM_CARE_RATE,
  EMPLOYMENT_INSURANCE_RATE,
  TAX_BRACKETS,
  EARNED_INCOME_DEDUCTION_BRACKETS,
} from "./constants";

interface SalaryInput {
  annualSalary: number;   // 만원
  monthlyTaxFree: number; // 만원 (월)
  dependents: number;     // 부양가족 수 (본인 포함)
  childrenUnder20: number;
}

export interface SalaryResult {
  annualSalary: number;
  monthlySalary: number;
  nationalPension: number;
  healthInsurance: number;
  longTermCare: number;
  employmentInsurance: number;
  incomeTax: number;
  localIncomeTax: number;
  totalDeduction: number;
  netSalary: number;
  netRatio: number; // 실수령 비율
}

/** 근로소득공제 계산 (만원 단위) */
function calcEarnedIncomeDeduction(totalSalary: number): number {
  let deduction = 0;
  let prev = 0;
  for (const bracket of EARNED_INCOME_DEDUCTION_BRACKETS) {
    if (totalSalary <= bracket.limit) {
      deduction = bracket.base + (totalSalary - prev) * bracket.rate;
      break;
    }
    prev = bracket.limit;
  }
  return deduction;
}

/** 산출세액 계산 (만원 단위) */
function calcIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  for (const bracket of TAX_BRACKETS) {
    if (taxableIncome <= bracket.limit) {
      return taxableIncome * bracket.rate - bracket.deduction;
    }
  }
  return 0;
}

/** 인적공제 계산 (만원 단위) */
function calcPersonalDeduction(dependents: number, childrenUnder20: number): number {
  // 기본공제: 1인당 150만원
  const basic = dependents * 150;
  // 자녀세액공제는 산출세액에서 빼므로 여기선 기본공제만
  return basic;
}

export function calculateSalary(input: SalaryInput): SalaryResult {
  const { annualSalary, monthlyTaxFree, dependents, childrenUnder20 } = input;
  const monthlySalary = annualSalary / 12;
  const monthlyTaxable = monthlySalary - monthlyTaxFree;

  // 4대보험 (월 기준, 과세 소득 기준)
  const pensionBase = Math.min(monthlyTaxable, NATIONAL_PENSION_MONTHLY_CAP);
  const nationalPension = Math.round(pensionBase * NATIONAL_PENSION_RATE * 10) / 10;
  const healthInsurance = Math.round(monthlyTaxable * HEALTH_INSURANCE_RATE * 10) / 10;
  const longTermCare = Math.round(healthInsurance * LONG_TERM_CARE_RATE * 10) / 10;
  const employmentInsurance = Math.round(monthlyTaxable * EMPLOYMENT_INSURANCE_RATE * 10) / 10;

  // 소득세 (연 기준으로 계산 후 12로 나눔)
  const annualTaxFree = monthlyTaxFree * 12;
  const annualTaxable = annualSalary - annualTaxFree;
  const earnedIncomeDeduction = calcEarnedIncomeDeduction(annualTaxable);
  const personalDeduction = calcPersonalDeduction(dependents, childrenUnder20);
  const taxableIncome = Math.max(annualTaxable - earnedIncomeDeduction - personalDeduction, 0);
  const annualTax = calcIncomeTax(taxableIncome);

  // 자녀세액공제 (20세 이하 자녀 1~2명: 1인당 15만원, 3명 이상: 30만원 + 추가 1인당 30만원)
  let childTaxCredit = 0;
  if (childrenUnder20 >= 3) {
    childTaxCredit = 30 + (childrenUnder20 - 2) * 30;
  } else if (childrenUnder20 > 0) {
    childTaxCredit = childrenUnder20 * 15;
  }

  const finalAnnualTax = Math.max(annualTax - childTaxCredit, 0);
  const incomeTax = Math.round((finalAnnualTax / 12) * 10) / 10;
  const localIncomeTax = Math.round(incomeTax * 0.1 * 10) / 10;

  const totalDeduction =
    nationalPension + healthInsurance + longTermCare +
    employmentInsurance + incomeTax + localIncomeTax;
  const netSalary = monthlySalary - totalDeduction;
  const netRatio = monthlySalary > 0 ? netSalary / monthlySalary : 0;

  return {
    annualSalary,
    monthlySalary: Math.round(monthlySalary * 10) / 10,
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    incomeTax,
    localIncomeTax,
    totalDeduction: Math.round(totalDeduction * 10) / 10,
    netSalary: Math.round(netSalary * 10) / 10,
    netRatio,
  };
}

/** 연봉별 실수령액 참고표 (5000만~15000만, 500만 단위, 부양가족 1인) */
export function calculateSalaryTable(): SalaryResult[] {
  const results: SalaryResult[] = [];
  for (let salary = 5000; salary <= 15000; salary += 500) {
    results.push(
      calculateSalary({
        annualSalary: salary,
        monthlyTaxFree: 20,
        dependents: 1,
        childrenUnder20: 0,
      })
    );
  }
  return results;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- __tests__/salary.test.ts
```

Expected: PASS (all 5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/salary.ts __tests__/salary.test.ts
git commit -m "feat: implement salary calculation logic with tests"
```

---

### Task 6: Salary Calculator Page

**Files:**
- Create: `app/salary/page.tsx`

- [ ] **Step 1: Create salary page**

Create `app/salary/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { YearBadge } from "@/components/year-badge";
import { AdSlot } from "@/components/ad-slot";
import { calculateSalary, calculateSalaryTable } from "@/lib/salary";
import { formatMoney, formatPercent } from "@/lib/format";

// SSR용 참고표 데이터는 모듈 레벨에서 생성
const salaryTable = calculateSalaryTable();

export default function SalaryPage() {
  const [annualSalary, setAnnualSalary] = useState(5000);
  const [monthlyTaxFree, setMonthlyTaxFree] = useState(20);
  const [dependents, setDependents] = useState(1);
  const [childrenUnder20, setChildrenUnder20] = useState(0);

  const result = calculateSalary({
    annualSalary,
    monthlyTaxFree,
    dependents,
    childrenUnder20,
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">연봉 실수령액 계산기</h1>
        <YearBadge />
      </div>

      <AdSlot className="mb-4" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 입력 */}
        <Card>
          <CardHeader>
            <CardTitle>입력</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="salary">연봉 (만원)</Label>
              <Input
                id="salary"
                type="number"
                value={annualSalary}
                onChange={(e) => setAnnualSalary(Number(e.target.value))}
                min={0}
                step={100}
              />
            </div>
            <div>
              <Label htmlFor="taxfree">비과세액 (월, 만원)</Label>
              <Input
                id="taxfree"
                type="number"
                value={monthlyTaxFree}
                onChange={(e) => setMonthlyTaxFree(Number(e.target.value))}
                min={0}
                step={10}
              />
            </div>
            <div>
              <Label htmlFor="dependents">부양가족 수 (본인 포함)</Label>
              <Input
                id="dependents"
                type="number"
                value={dependents}
                onChange={(e) => setDependents(Number(e.target.value))}
                min={1}
                step={1}
              />
            </div>
            <div>
              <Label htmlFor="children">20세 이하 자녀 수</Label>
              <Input
                id="children"
                type="number"
                value={childrenUnder20}
                onChange={(e) => setChildrenUnder20(Number(e.target.value))}
                min={0}
                step={1}
              />
            </div>
          </CardContent>
        </Card>

        {/* 결과 */}
        <Card>
          <CardHeader>
            <CardTitle>월 실수령액</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary mb-2">
              {formatMoney(result.netSalary)}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              연봉 대비 {formatPercent(result.netRatio)}
            </p>
            <Separator className="my-4" />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>공제 항목</TableHead>
                  <TableHead className="text-right">금액 (만원)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>국민연금</TableCell>
                  <TableCell className="text-right">{result.nationalPension.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>건강보험</TableCell>
                  <TableCell className="text-right">{result.healthInsurance.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>장기요양보험</TableCell>
                  <TableCell className="text-right">{result.longTermCare.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>고용보험</TableCell>
                  <TableCell className="text-right">{result.employmentInsurance.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>소득세</TableCell>
                  <TableCell className="text-right">{result.incomeTax.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>지방소득세</TableCell>
                  <TableCell className="text-right">{result.localIncomeTax.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow className="font-bold">
                  <TableCell>공제 합계</TableCell>
                  <TableCell className="text-right">{result.totalDeduction.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 연봉별 참고표 */}
        <Card>
          <CardHeader>
            <CardTitle>연봉별 실수령액 참고표</CardTitle>
            <p className="text-sm text-muted-foreground">부양가족 1인(본인) 기준</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>연봉</TableHead>
                  <TableHead className="text-right">월 실수령액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryTable.map((row) => (
                  <TableRow key={row.annualSalary}>
                    <TableCell>{formatMoney(row.annualSalary)}</TableCell>
                    <TableCell className="text-right">{formatMoney(row.netSalary)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        * 근사치이며 실제 급여와 차이가 있을 수 있습니다. 간이세액표 기반 근사 계산입니다.
      </p>

      <AdSlot className="mt-4" />
    </section>
  );
}
```

- [ ] **Step 2: Add page metadata**

The page is `"use client"` so metadata must be in a separate `layout.tsx` or `metadata.ts`. Create `app/salary/layout.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "연봉 실수령액 계산기 2026",
  description: "2026년 기준 연봉 실수령액 계산기. 4대보험, 소득세 공제 후 월 실수령액을 바로 확인하세요. 연봉 5천만원~1억5천만원 참고표 제공.",
  keywords: ["연봉 실수령액", "2026 연봉 계산기", "실수령액 계산기", "4대보험 계산", "소득세 계산"],
  openGraph: {
    title: "연봉 실수령액 계산기 2026 | FIRE Tools",
    description: "4대보험 + 소득세 공제 후 월 실수령액 계산",
  },
};

export default function SalaryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Visit `localhost:3000/salary` — 입력 변경 시 결과가 즉시 반영되는지 확인. 참고표가 우측에 표시되는지 확인.

- [ ] **Step 4: Commit**

```bash
git add app/salary/
git commit -m "feat: add salary calculator page with reference table"
```

---

### Task 7: Rent-Convert Calculation Logic

**Files:**
- Create: `lib/rent-convert.ts`
- Test: `__tests__/rent-convert.test.ts`

- [ ] **Step 1: Write tests**

Create `__tests__/rent-convert.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { convertRent } from "@/lib/rent-convert";

describe("convertRent — jeonse to monthly", () => {
  it("converts 3억 jeonse with 1억 deposit at 2.5%", () => {
    const result = convertRent({
      direction: "jeonse-to-monthly",
      jeonse: 30000,
      deposit: 10000,
      conversionRate: 2.5,
      investmentReturnRate: 4.0,
    });

    // 월세 = (30000 - 10000) * 0.025 / 12 = 41.67
    expect(result.monthlyRent).toBeCloseTo(41.7, 0);
    expect(result.annualRent).toBeCloseTo(500, 0);

    // 손익: 여유자금 2억 * 4% = 800만원 투자수익, 연 월세 500만원
    // 월세 전환이 연 300만원 이득
    expect(result.profitAnalysis.annualInvestmentReturn).toBeCloseTo(800, 0);
    expect(result.profitAnalysis.annualDifference).toBeCloseTo(300, 0);
    expect(result.profitAnalysis.recommendation).toBe("monthly");
  });
});

describe("convertRent — monthly to jeonse", () => {
  it("converts 1억 deposit + 50만원 monthly at 2.5%", () => {
    const result = convertRent({
      direction: "monthly-to-jeonse",
      deposit: 10000,
      monthlyRent: 50,
      conversionRate: 2.5,
      investmentReturnRate: 4.0,
    });

    // 전세금 = 10000 + (50 * 12 / 0.025) = 10000 + 24000 = 34000
    expect(result.jeonse).toBeCloseTo(34000, 0);
    expect(result.annualRent).toBeCloseTo(600, 0);

    // 손익: 추가보증금 24000 * 4% = 960 기회비용, 절약 월세 600
    // 전세 전환 시 연 360만원 손해 (기회비용 > 절약 월세)
    expect(result.profitAnalysis.annualOpportunityCost).toBeCloseTo(960, 0);
    expect(result.profitAnalysis.annualDifference).toBeCloseTo(-360, 0);
    expect(result.profitAnalysis.recommendation).toBe("monthly");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- __tests__/rent-convert.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement rent-convert calculation**

Create `lib/rent-convert.ts`:

```ts
interface JeonseToMonthlyInput {
  direction: "jeonse-to-monthly";
  jeonse: number;     // 전세금 (만원)
  deposit: number;    // 보증금 (만원)
  conversionRate: number; // 전월세 전환율 (%)
  investmentReturnRate: number; // 투자 수익률 (%)
}

interface MonthlyToJeonseInput {
  direction: "monthly-to-jeonse";
  deposit: number;      // 보증금 (만원)
  monthlyRent: number;  // 월세 (만원)
  conversionRate: number;
  investmentReturnRate: number;
}

export type RentConvertInput = JeonseToMonthlyInput | MonthlyToJeonseInput;

interface ProfitAnalysis {
  annualInvestmentReturn: number; // 여유자금 투자 수익 (연)
  annualOpportunityCost: number;  // 추가 보증금 기회비용 (연)
  annualRent: number;             // 연간 월세
  annualDifference: number;       // + 면 월세 유리, - 면 전세 유리
  recommendation: "jeonse" | "monthly";
}

interface JeonseToMonthlyResult {
  direction: "jeonse-to-monthly";
  jeonse: number;
  deposit: number;
  monthlyRent: number;
  annualRent: number;
  freeCapital: number;
  profitAnalysis: ProfitAnalysis;
}

interface MonthlyToJeonseResult {
  direction: "monthly-to-jeonse";
  jeonse: number;
  deposit: number;
  monthlyRent: number;
  annualRent: number;
  additionalDeposit: number;
  profitAnalysis: ProfitAnalysis;
}

export type RentConvertResult = JeonseToMonthlyResult | MonthlyToJeonseResult;

export function convertRent(input: RentConvertInput): RentConvertResult {
  const rate = input.conversionRate / 100;
  const investRate = input.investmentReturnRate / 100;

  if (input.direction === "jeonse-to-monthly") {
    const diff = input.jeonse - input.deposit;
    const monthlyRent = Math.round((diff * rate / 12) * 10) / 10;
    const annualRent = Math.round(monthlyRent * 12 * 10) / 10;
    const freeCapital = diff;
    const annualInvestmentReturn = Math.round(freeCapital * investRate * 10) / 10;
    const annualDifference = Math.round((annualInvestmentReturn - annualRent) * 10) / 10;

    return {
      direction: "jeonse-to-monthly",
      jeonse: input.jeonse,
      deposit: input.deposit,
      monthlyRent,
      annualRent,
      freeCapital,
      profitAnalysis: {
        annualInvestmentReturn,
        annualOpportunityCost: 0,
        annualRent,
        annualDifference,
        recommendation: annualDifference >= 0 ? "monthly" : "jeonse",
      },
    };
  }

  // monthly-to-jeonse
  const jeonse = Math.round((input.deposit + (input.monthlyRent * 12 / rate)) * 10) / 10;
  const additionalDeposit = jeonse - input.deposit;
  const annualRent = Math.round(input.monthlyRent * 12 * 10) / 10;
  const annualOpportunityCost = Math.round(additionalDeposit * investRate * 10) / 10;
  const annualDifference = Math.round((annualRent - annualOpportunityCost) * 10) / 10;

  return {
    direction: "monthly-to-jeonse",
    jeonse,
    deposit: input.deposit,
    monthlyRent: input.monthlyRent,
    annualRent,
    additionalDeposit,
    profitAnalysis: {
      annualInvestmentReturn: 0,
      annualOpportunityCost,
      annualRent,
      annualDifference,
      recommendation: annualDifference >= 0 ? "jeonse" : "monthly",
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- __tests__/rent-convert.test.ts
```

Expected: PASS (all 2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/rent-convert.ts __tests__/rent-convert.test.ts
git commit -m "feat: implement rent conversion logic with profit analysis"
```

---

### Task 8: Rent-Convert Calculator Page

**Files:**
- Create: `app/rent-convert/page.tsx`, `app/rent-convert/layout.tsx`

- [ ] **Step 1: Create rent-convert page**

Create `app/rent-convert/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { YearBadge } from "@/components/year-badge";
import { AdSlot } from "@/components/ad-slot";
import { convertRent, RentConvertResult } from "@/lib/rent-convert";
import { formatMoney } from "@/lib/format";
import {
  DEFAULT_RENT_CONVERSION_RATE,
  DEFAULT_INVESTMENT_RETURN_RATE,
} from "@/lib/constants";

export default function RentConvertPage() {
  const [direction, setDirection] = useState<"jeonse-to-monthly" | "monthly-to-jeonse">("jeonse-to-monthly");
  const [jeonse, setJeonse] = useState(30000);
  const [deposit, setDeposit] = useState(10000);
  const [monthlyRent, setMonthlyRent] = useState(50);
  const [conversionRate, setConversionRate] = useState(DEFAULT_RENT_CONVERSION_RATE);
  const [investmentReturnRate, setInvestmentReturnRate] = useState(DEFAULT_INVESTMENT_RETURN_RATE);

  const result: RentConvertResult = convertRent(
    direction === "jeonse-to-monthly"
      ? { direction, jeonse, deposit, conversionRate, investmentReturnRate }
      : { direction, deposit, monthlyRent, conversionRate, investmentReturnRate }
  );

  const analysis = result.profitAnalysis;
  const isMonthlyBetter = analysis.recommendation === "monthly";
  const absDiff = Math.abs(analysis.annualDifference);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">전월세 전환 계산기</h1>
        <YearBadge />
      </div>

      <AdSlot className="mb-4" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 입력 */}
        <Card>
          <CardHeader>
            <CardTitle>입력</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>전환 방향</Label>
              <div className="flex gap-2 mt-1">
                <button
                  className={`flex-1 rounded-md border px-3 py-2 text-sm ${direction === "jeonse-to-monthly" ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setDirection("jeonse-to-monthly")}
                >
                  전세 → 월세
                </button>
                <button
                  className={`flex-1 rounded-md border px-3 py-2 text-sm ${direction === "monthly-to-jeonse" ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setDirection("monthly-to-jeonse")}
                >
                  월세 → 전세
                </button>
              </div>
            </div>

            {direction === "jeonse-to-monthly" && (
              <div>
                <Label htmlFor="jeonse">전세금 (만원)</Label>
                <Input id="jeonse" type="number" value={jeonse} onChange={(e) => setJeonse(Number(e.target.value))} min={0} step={1000} />
              </div>
            )}

            <div>
              <Label htmlFor="deposit">보증금 (만원)</Label>
              <Input id="deposit" type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} min={0} step={1000} />
            </div>

            {direction === "monthly-to-jeonse" && (
              <div>
                <Label htmlFor="monthly">월세 (만원)</Label>
                <Input id="monthly" type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(Number(e.target.value))} min={0} step={5} />
              </div>
            )}

            <div>
              <Label htmlFor="rate">전월세 전환율 (%)</Label>
              <Input id="rate" type="number" value={conversionRate} onChange={(e) => setConversionRate(Number(e.target.value))} min={0.1} step={0.1} />
            </div>

            <div>
              <Label htmlFor="invest">예상 투자 수익률 (%)</Label>
              <Input id="invest" type="number" value={investmentReturnRate} onChange={(e) => setInvestmentReturnRate(Number(e.target.value))} min={0} step={0.5} />
            </div>
          </CardContent>
        </Card>

        {/* 결과 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>전환 결과</CardTitle>
            </CardHeader>
            <CardContent>
              {direction === "jeonse-to-monthly" ? (
                <>
                  <p className="text-sm text-muted-foreground">환산 월세</p>
                  <p className="text-4xl font-bold text-primary">{formatMoney(result.monthlyRent)}</p>
                  <p className="text-sm text-muted-foreground mt-1">연간 월세 총액: {formatMoney(result.annualRent)}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">환산 전세금</p>
                  <p className="text-4xl font-bold text-primary">{formatMoney((result as any).jeonse)}</p>
                  <p className="text-sm text-muted-foreground mt-1">연간 월세 총액: {formatMoney(result.annualRent)}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>손익 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${isMonthlyBetter ? "text-blue-600" : "text-green-600"}`}>
                {isMonthlyBetter ? "월세" : "전세"}가 연 {formatMoney(absDiff)} 이득
              </p>
              <Separator className="my-3" />
              {direction === "jeonse-to-monthly" && result.direction === "jeonse-to-monthly" && (
                <div className="space-y-1 text-sm">
                  <p>여유 자금: {formatMoney(result.freeCapital)}</p>
                  <p>여유 자금 투자 수익 (연): {formatMoney(analysis.annualInvestmentReturn)}</p>
                  <p>연간 월세 지출: {formatMoney(analysis.annualRent)}</p>
                </div>
              )}
              {direction === "monthly-to-jeonse" && result.direction === "monthly-to-jeonse" && (
                <div className="space-y-1 text-sm">
                  <p>추가 보증금: {formatMoney(result.additionalDeposit)}</p>
                  <p>보증금 기회비용 (연): {formatMoney(analysis.annualOpportunityCost)}</p>
                  <p>절약되는 월세 (연): {formatMoney(analysis.annualRent)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        * 전월세 전환율은 한국은행 기준입니다. 실제 전환율은 지역과 시기에 따라 다를 수 있습니다.
      </p>

      <AdSlot className="mt-4" />
    </section>
  );
}
```

- [ ] **Step 2: Add page metadata**

Create `app/rent-convert/layout.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "전월세 전환 계산기 2026",
  description: "전세↔월세 전환 계산기. 전월세 전환율 기반 환산 + 투자 수익률 대비 손익 분석까지 한 번에.",
  keywords: ["전월세 전환", "전월세 전환 계산기", "전세 월세 비교", "전월세 전환율 2026"],
  openGraph: {
    title: "전월세 전환 계산기 2026 | FIRE Tools",
    description: "전세↔월세 전환 금액 및 손익 분석",
  },
};

export default function RentConvertLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Visit `localhost:3000/rent-convert` — 방향 토글, 입력 변경 시 전환 결과 + 손익 분석 즉시 반영 확인.

- [ ] **Step 4: Commit**

```bash
git add app/rent-convert/
git commit -m "feat: add rent conversion calculator page with profit analysis"
```

---

### Task 9: Loan Calculation Logic

**Files:**
- Create: `lib/loan.ts`
- Test: `__tests__/loan.test.ts`

- [ ] **Step 1: Write tests**

Create `__tests__/loan.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  calculateEqualPrincipalInterest,
  calculateEqualPrincipal,
  calculateGraduated,
  analyzeEarlyRepayment,
} from "@/lib/loan";

describe("calculateEqualPrincipalInterest (원리금균등)", () => {
  it("calculates 1억 loan, 4%, 30 years", () => {
    const result = calculateEqualPrincipalInterest(10000, 4, 30, 0);

    expect(result.schedule).toHaveLength(360);
    // 매달 동일 상환액
    const firstPayment = result.schedule[0].payment;
    const lastPayment = result.schedule[359].payment;
    expect(firstPayment).toBeCloseTo(lastPayment, 0);
    // 총상환액 > 원금
    expect(result.totalPayment).toBeGreaterThan(10000);
    expect(result.totalInterest).toBeGreaterThan(0);
    // 잔액이 0으로 수렴
    expect(result.schedule[359].balance).toBeCloseTo(0, 0);
  });

  it("handles grace period", () => {
    const result = calculateEqualPrincipalInterest(10000, 4, 10, 12);

    // 거치기간 12개월 동안은 이자만
    expect(result.schedule[0].principal).toBeCloseTo(0, 0);
    expect(result.schedule[0].interest).toBeGreaterThan(0);
    // 거치 후 원금 상환 시작
    expect(result.schedule[12].principal).toBeGreaterThan(0);
  });
});

describe("calculateEqualPrincipal (원금균등)", () => {
  it("calculates 1억 loan, 4%, 30 years", () => {
    const result = calculateEqualPrincipal(10000, 4, 30, 0);

    expect(result.schedule).toHaveLength(360);
    // 매달 원금은 동일
    const monthlyPrincipal = 10000 / 360;
    expect(result.schedule[0].principal).toBeCloseTo(monthlyPrincipal, 0);
    expect(result.schedule[100].principal).toBeCloseTo(monthlyPrincipal, 0);
    // 상환액 감소 (첫 달 > 마지막 달)
    expect(result.schedule[0].payment).toBeGreaterThan(result.schedule[359].payment);
    expect(result.schedule[359].balance).toBeCloseTo(0, 0);
  });
});

describe("calculateGraduated (체증식)", () => {
  it("calculates 1억 loan, 4%, 30 years", () => {
    const result = calculateGraduated(10000, 4, 30, 0);

    expect(result.schedule).toHaveLength(360);
    // 상환액 증가 (첫 달 < 마지막 달)
    expect(result.schedule[0].payment).toBeLessThan(result.schedule[359].payment);
    expect(result.schedule[359].balance).toBeCloseTo(0, 0);
  });
});

describe("analyzeEarlyRepayment", () => {
  it("shows profit when remaining interest > penalty", () => {
    const result = analyzeEarlyRepayment({
      principal: 10000,
      annualRate: 4,
      totalMonths: 360,
      gracePeriod: 0,
      repaymentMonth: 60,
      penaltyRate: 1.0,
    });

    // 5년 차에 조기상환하면 남은 이자가 수수료보다 클 것
    expect(result.remainingInterest).toBeGreaterThan(result.penaltyFee);
    expect(result.netSaving).toBeGreaterThan(0);
  });

  it("finds breakeven month", () => {
    const result = analyzeEarlyRepayment({
      principal: 10000,
      annualRate: 4,
      totalMonths: 360,
      gracePeriod: 0,
      repaymentMonth: 1,
      penaltyRate: 1.5,
    });

    expect(result.breakevenMonth).toBeGreaterThan(0);
    expect(result.breakevenMonth).toBeLessThan(360);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- __tests__/loan.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement loan calculation**

Create `lib/loan.ts`:

```ts
export interface ScheduleRow {
  month: number;
  payment: number;    // 월 상환액 (만원)
  principal: number;  // 원금 상환 (만원)
  interest: number;   // 이자 (만원)
  balance: number;    // 잔액 (만원)
}

export interface LoanResult {
  schedule: ScheduleRow[];
  totalPayment: number;
  totalInterest: number;
  firstPayment: number;
  lastPayment: number;
}

/** 원리금균등 상환 */
export function calculateEqualPrincipalInterest(
  principal: number, annualRate: number, years: number, gracePeriod: number
): LoanResult {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;
  const repayMonths = totalMonths - gracePeriod;
  const schedule: ScheduleRow[] = [];
  let balance = principal;

  // 거치기간 월 상환액 (이자만)
  // 상환기간 월 상환액 (PMT)
  const pmt = repayMonths > 0
    ? principal * monthlyRate * Math.pow(1 + monthlyRate, repayMonths) /
      (Math.pow(1 + monthlyRate, repayMonths) - 1)
    : 0;

  for (let m = 1; m <= totalMonths; m++) {
    const interest = Math.round(balance * monthlyRate * 10) / 10;

    if (m <= gracePeriod) {
      schedule.push({ month: m, payment: interest, principal: 0, interest, balance });
    } else {
      const principalPart = Math.round((pmt - interest) * 10) / 10;
      balance = Math.round((balance - principalPart) * 10) / 10;
      if (balance < 0) balance = 0;
      schedule.push({
        month: m,
        payment: Math.round(pmt * 10) / 10,
        principal: principalPart,
        interest,
        balance,
      });
    }
  }

  const totalPayment = Math.round(schedule.reduce((s, r) => s + r.payment, 0) * 10) / 10;

  return {
    schedule,
    totalPayment,
    totalInterest: Math.round((totalPayment - principal) * 10) / 10,
    firstPayment: schedule[0].payment,
    lastPayment: schedule[schedule.length - 1].payment,
  };
}

/** 원금균등 상환 */
export function calculateEqualPrincipal(
  principal: number, annualRate: number, years: number, gracePeriod: number
): LoanResult {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;
  const repayMonths = totalMonths - gracePeriod;
  const monthlyPrincipal = repayMonths > 0 ? principal / repayMonths : 0;
  const schedule: ScheduleRow[] = [];
  let balance = principal;

  for (let m = 1; m <= totalMonths; m++) {
    const interest = Math.round(balance * monthlyRate * 10) / 10;

    if (m <= gracePeriod) {
      schedule.push({ month: m, payment: interest, principal: 0, interest, balance });
    } else {
      const pPart = Math.round(monthlyPrincipal * 10) / 10;
      const payment = Math.round((pPart + interest) * 10) / 10;
      balance = Math.round((balance - pPart) * 10) / 10;
      if (balance < 0) balance = 0;
      schedule.push({ month: m, payment, principal: pPart, interest, balance });
    }
  }

  const totalPayment = Math.round(schedule.reduce((s, r) => s + r.payment, 0) * 10) / 10;

  return {
    schedule,
    totalPayment,
    totalInterest: Math.round((totalPayment - principal) * 10) / 10,
    firstPayment: schedule[0].payment,
    lastPayment: schedule[schedule.length - 1].payment,
  };
}

/** 체증식 상환 (graduated payment — 매월 일정 비율로 상환액 증가) */
export function calculateGraduated(
  principal: number, annualRate: number, years: number, gracePeriod: number
): LoanResult {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;
  const repayMonths = totalMonths - gracePeriod;
  const schedule: ScheduleRow[] = [];
  let balance = principal;

  // 체증식: 월 상환 원금이 등차수열로 증가
  // 총 원금 = sum(k, k=1..n) * d = n*(n+1)/2 * d = principal
  // d = 2 * principal / (n * (n + 1))
  const d = repayMonths > 0 ? (2 * principal) / (repayMonths * (repayMonths + 1)) : 0;

  let repayIndex = 0;

  for (let m = 1; m <= totalMonths; m++) {
    const interest = Math.round(balance * monthlyRate * 10) / 10;

    if (m <= gracePeriod) {
      schedule.push({ month: m, payment: interest, principal: 0, interest, balance });
    } else {
      repayIndex++;
      const pPart = Math.round(d * repayIndex * 10) / 10;
      const payment = Math.round((pPart + interest) * 10) / 10;
      balance = Math.round((balance - pPart) * 10) / 10;
      if (balance < 0) balance = 0;
      schedule.push({ month: m, payment, principal: pPart, interest, balance });
    }
  }

  const totalPayment = Math.round(schedule.reduce((s, r) => s + r.payment, 0) * 10) / 10;

  return {
    schedule,
    totalPayment,
    totalInterest: Math.round((totalPayment - principal) * 10) / 10,
    firstPayment: schedule[0].payment,
    lastPayment: schedule[schedule.length - 1].payment,
  };
}

/** 조기상환 손익 분석 */
interface EarlyRepaymentInput {
  principal: number;
  annualRate: number;
  totalMonths: number;
  gracePeriod: number;
  repaymentMonth: number;   // 조기상환 시점 (개월차)
  penaltyRate: number;      // 조기상환수수료율 (%)
}

export interface EarlyRepaymentResult {
  remainingBalance: number;     // 조기상환 시점 잔액
  remainingInterest: number;    // 남은 기간 이자 총액
  penaltyFee: number;           // 조기상환수수료
  netSaving: number;            // 순 절약 (+ 이면 조기상환 유리)
  breakevenMonth: number;       // 손익분기 개월차 (이후 갚으면 이득)
}

export function analyzeEarlyRepayment(input: EarlyRepaymentInput): EarlyRepaymentResult {
  const { principal, annualRate, totalMonths, gracePeriod, repaymentMonth, penaltyRate } = input;
  const years = totalMonths / 12;

  // 원리금균등 기준으로 분석
  const full = calculateEqualPrincipalInterest(principal, annualRate, years, gracePeriod);

  // 조기상환 시점 잔액
  const monthIndex = Math.min(repaymentMonth - 1, full.schedule.length - 1);
  const remainingBalance = full.schedule[monthIndex].balance;

  // 남은 기간 이자 총액
  const remainingInterest = Math.round(
    full.schedule.slice(repaymentMonth).reduce((s, r) => s + r.interest, 0) * 10
  ) / 10;

  // 수수료
  const penaltyFee = Math.round(remainingBalance * (penaltyRate / 100) * 10) / 10;

  const netSaving = Math.round((remainingInterest - penaltyFee) * 10) / 10;

  // 손익분기점 찾기: 어느 시점부터 갚으면 이득인가
  let breakevenMonth = 0;
  for (let m = 1; m < full.schedule.length; m++) {
    const bal = full.schedule[m - 1].balance;
    const fee = bal * (penaltyRate / 100);
    const remInt = full.schedule.slice(m).reduce((s, r) => s + r.interest, 0);
    if (remInt > fee) {
      breakevenMonth = m;
      break;
    }
  }

  return {
    remainingBalance,
    remainingInterest,
    penaltyFee,
    netSaving,
    breakevenMonth,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- __tests__/loan.test.ts
```

Expected: PASS (all 5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/loan.ts __tests__/loan.test.ts
git commit -m "feat: implement loan repayment calculation with early repayment analysis"
```

---

### Task 10: Loan Calculator Page

**Files:**
- Create: `app/loan/page.tsx`, `app/loan/layout.tsx`

- [ ] **Step 1: Create loan page**

Create `app/loan/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { YearBadge } from "@/components/year-badge";
import { AdSlot } from "@/components/ad-slot";
import {
  calculateEqualPrincipalInterest,
  calculateEqualPrincipal,
  calculateGraduated,
  analyzeEarlyRepayment,
  LoanResult,
} from "@/lib/loan";
import { formatMoney } from "@/lib/format";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export default function LoanPage() {
  const [principal, setPrincipal] = useState(30000);
  const [annualRate, setAnnualRate] = useState(4.0);
  const [years, setYears] = useState(30);
  const [gracePeriod, setGracePeriod] = useState(0);
  const [repaymentMonth, setRepaymentMonth] = useState(60);
  const [penaltyRate, setPenaltyRate] = useState(1.2);
  const [showSchedule, setShowSchedule] = useState<string | null>(null);

  const epi = calculateEqualPrincipalInterest(principal, annualRate, years, gracePeriod);
  const ep = calculateEqualPrincipal(principal, annualRate, years, gracePeriod);
  const grad = calculateGraduated(principal, annualRate, years, gracePeriod);

  const earlyResult = analyzeEarlyRepayment({
    principal,
    annualRate,
    totalMonths: years * 12,
    gracePeriod,
    repaymentMonth,
    penaltyRate,
  });

  // 차트용 데이터 (12개월 단위 샘플링)
  const chartData = epi.schedule
    .filter((_, i) => i % 12 === 0 || i === epi.schedule.length - 1)
    .map((row, idx) => ({
      month: row.month,
      원리금균등: epi.schedule[row.month - 1]?.payment ?? 0,
      원금균등: ep.schedule[row.month - 1]?.payment ?? 0,
      체증식: grad.schedule[row.month - 1]?.payment ?? 0,
    }));

  const interestDiff = Math.round((epi.totalInterest - ep.totalInterest) * 10) / 10;

  const methods: { key: string; label: string; result: LoanResult; desc: string }[] = [
    { key: "epi", label: "원리금균등", result: epi, desc: "매달 같은 금액. 가장 일반적" },
    { key: "ep", label: "원금균등", result: ep, desc: "총이자 적지만 초반 부담 큼" },
    { key: "grad", label: "체증식", result: grad, desc: "초반 부담 적음, 상환액 점차 증가" },
  ];

  function renderSchedule(result: LoanResult) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>회차</TableHead>
            <TableHead className="text-right">상환액</TableHead>
            <TableHead className="text-right">원금</TableHead>
            <TableHead className="text-right">이자</TableHead>
            <TableHead className="text-right">잔액</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.schedule.map((row) => (
            <TableRow key={row.month}>
              <TableCell>{row.month}</TableCell>
              <TableCell className="text-right">{row.payment.toLocaleString()}</TableCell>
              <TableCell className="text-right">{row.principal.toLocaleString()}</TableCell>
              <TableCell className="text-right">{row.interest.toLocaleString()}</TableCell>
              <TableCell className="text-right">{row.balance.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">대출 상환 계산기</h1>
        <YearBadge />
      </div>

      <AdSlot className="mb-4" />

      {/* 입력 */}
      <Card>
        <CardHeader><CardTitle>대출 조건</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="principal">대출 원금 (만원)</Label>
              <Input id="principal" type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} min={0} step={1000} />
            </div>
            <div>
              <Label htmlFor="rate">연 이자율 (%)</Label>
              <Input id="rate" type="number" value={annualRate} onChange={(e) => setAnnualRate(Number(e.target.value))} min={0.1} step={0.1} />
            </div>
            <div>
              <Label htmlFor="years">대출 기간 (년)</Label>
              <Input id="years" type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} min={1} step={1} />
            </div>
            <div>
              <Label htmlFor="grace">거치 기간 (개월)</Label>
              <Input id="grace" type="number" value={gracePeriod} onChange={(e) => setGracePeriod(Number(e.target.value))} min={0} step={1} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3방식 비교 카드 */}
      <div className="grid gap-4 sm:grid-cols-3">
        {methods.map((m) => (
          <Card key={m.key}>
            <CardHeader>
              <CardTitle className="text-base">{m.label}</CardTitle>
              <p className="text-sm text-muted-foreground">{m.desc}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>첫 달 상환액</span>
                <span className="font-medium">{formatMoney(m.result.firstPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span>마지막 달 상환액</span>
                <span className="font-medium">{formatMoney(m.result.lastPayment)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>총 이자</span>
                <span className="font-medium text-red-500">{formatMoney(m.result.totalInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span>총 상환액</span>
                <span className="font-medium">{formatMoney(m.result.totalPayment)}</span>
              </div>
              <button
                className="text-primary underline text-xs mt-2"
                onClick={() => setShowSchedule(showSchedule === m.key ? null : m.key)}
              >
                {showSchedule === m.key ? "상세 스케줄 닫기" : "상세 스케줄 보기"}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 총이자 차이 안내 */}
      <p className="text-sm font-medium">
        원금균등이 원리금균등보다 총 이자 {formatMoney(interestDiff)} 적습니다.
      </p>

      {/* 상세 스케줄 (토글) */}
      {showSchedule && (
        <Card>
          <CardHeader>
            <CardTitle>{methods.find((m) => m.key === showSchedule)?.label} 상환 스케줄</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {renderSchedule(methods.find((m) => m.key === showSchedule)!.result)}
          </CardContent>
        </Card>
      )}

      {/* 차트 */}
      <Card>
        <CardHeader><CardTitle>월 상환액 추이 비교</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <XAxis dataKey="month" label={{ value: "개월", position: "insideBottomRight", offset: -5 }} />
              <YAxis label={{ value: "만원", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString()}만원`} />
              <Legend />
              <Line type="monotone" dataKey="원리금균등" stroke="#2563EB" dot={false} />
              <Line type="monotone" dataKey="원금균등" stroke="#10B981" dot={false} />
              <Line type="monotone" dataKey="체증식" stroke="#F59E0B" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 조기상환 분석 */}
      <Card>
        <CardHeader><CardTitle>조기상환 손익 분석</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="repayMonth">조기상환 시점 (개월차)</Label>
              <Input id="repayMonth" type="number" value={repaymentMonth} onChange={(e) => setRepaymentMonth(Number(e.target.value))} min={1} max={years * 12} step={1} />
            </div>
            <div>
              <Label htmlFor="penalty">조기상환수수료율 (%)</Label>
              <Input id="penalty" type="number" value={penaltyRate} onChange={(e) => setPenaltyRate(Number(e.target.value))} min={0} step={0.1} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{repaymentMonth}개월차 잔액</span>
              <span className="font-medium">{formatMoney(earlyResult.remainingBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span>남은 기간 이자 총액</span>
              <span className="font-medium">{formatMoney(earlyResult.remainingInterest)}</span>
            </div>
            <div className="flex justify-between">
              <span>조기상환수수료</span>
              <span className="font-medium text-red-500">{formatMoney(earlyResult.penaltyFee)}</span>
            </div>
            <Separator />
            <p className={`text-xl font-bold ${earlyResult.netSaving > 0 ? "text-green-600" : "text-red-600"}`}>
              {earlyResult.netSaving > 0
                ? `지금 갚으면 ${formatMoney(earlyResult.netSaving)} 이득`
                : `수수료가 더 크므로 ${formatMoney(Math.abs(earlyResult.netSaving))} 손해`}
            </p>
            {earlyResult.breakevenMonth > 0 && (
              <p className="text-sm text-muted-foreground">
                {earlyResult.breakevenMonth}개월차 이후부터 갚으면 이득입니다.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AdSlot className="mt-4" />
    </section>
  );
}
```

- [ ] **Step 2: Add page metadata**

Create `app/loan/layout.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대출 상환 계산기 2026",
  description: "원리금균등·원금균등·체증식 3가지 상환 방식 비교 + 조기상환 손익 분석. 대출 상환 계획을 한눈에.",
  keywords: ["대출 상환 계산기", "원리금균등", "원금균등", "체증식", "조기상환", "대출 이자 계산"],
  openGraph: {
    title: "대출 상환 계산기 2026 | FIRE Tools",
    description: "3가지 상환 방식 비교 + 조기상환 손익 분석",
  },
};

export default function LoanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Visit `localhost:3000/loan` — 3가지 방식 비교 카드, 차트, 조기상환 분석이 모두 동작하는지 확인.

- [ ] **Step 4: Commit**

```bash
git add app/loan/
git commit -m "feat: add loan repayment calculator page with comparison chart and early repayment analysis"
```

---

### Task 11: SEO — robots.txt and sitemap

**Files:**
- Create: `app/robots.ts`, `app/sitemap.ts`

- [ ] **Step 1: Create robots.ts**

Create `app/robots.ts`:

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://fire-tools.vercel.app/sitemap.xml",
  };
}
```

- [ ] **Step 2: Create sitemap.ts**

Create `app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://fire-tools.vercel.app";

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/salary`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.9 },
    { url: `${baseUrl}/rent-convert`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.8 },
    { url: `${baseUrl}/loan`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.8 },
  ];
}
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Visit `localhost:3000/robots.txt` and `localhost:3000/sitemap.xml` — both should render correctly.

- [ ] **Step 4: Commit**

```bash
git add app/robots.ts app/sitemap.ts
git commit -m "feat: add robots.txt and sitemap.xml for SEO"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Run all tests**

```bash
npm run test:run
```

Expected: ALL PASS.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Verify all pages**

```bash
npm run dev
```

Check each route:
- `/` — 4개 도구 카드
- `/salary` — 계산기 + 참고표
- `/rent-convert` — 전환 + 손익 분석
- `/loan` — 3방식 비교 + 차트 + 조기상환 분석

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: final adjustments after verification"
```
