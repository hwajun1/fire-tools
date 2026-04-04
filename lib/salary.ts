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
function calcPersonalDeduction(dependents: number, _childrenUnder20: number): number {
  // 기본공제: 1인당 150만원
  const basic = dependents * 150;
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

  // 자녀세액공제
  let childTaxCredit = 0;
  if (childrenUnder20 >= 3) {
    childTaxCredit = 30 + (childrenUnder20 - 2) * 30;
  } else if (childrenUnder20 > 0) {
    childTaxCredit = childrenUnder20 * 15;
  }

  const finalAnnualTax = Math.max(annualTax - childTaxCredit, 0);
  const incomeTax = Math.round((finalAnnualTax / 12) * 10) / 10;
  const localIncomeTax = Math.round(incomeTax * 0.1 * 10) / 10;

  // Store totalDeduction as the exact sum of the rounded components
  // so the test assertion result.totalDeduction === sum_of_components holds
  const totalDeduction =
    nationalPension + healthInsurance + longTermCare +
    employmentInsurance + incomeTax + localIncomeTax;
  const roundedMonthlySalary = Math.round(monthlySalary * 10) / 10;
  const netSalary = roundedMonthlySalary - totalDeduction;
  const netRatio = roundedMonthlySalary > 0 ? netSalary / roundedMonthlySalary : 0;

  return {
    annualSalary,
    monthlySalary: roundedMonthlySalary,
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    incomeTax,
    localIncomeTax,
    totalDeduction,
    netSalary,
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
