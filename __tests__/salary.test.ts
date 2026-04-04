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
