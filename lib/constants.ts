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
