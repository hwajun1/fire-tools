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

  it("handles partial early repayment", () => {
    const full = analyzeEarlyRepayment({
      principal: 10000,
      annualRate: 4,
      totalMonths: 360,
      gracePeriod: 0,
      repaymentMonth: 60,
      penaltyRate: 1.0,
    });

    const partial = analyzeEarlyRepayment({
      principal: 10000,
      annualRate: 4,
      totalMonths: 360,
      gracePeriod: 0,
      repaymentMonth: 60,
      penaltyRate: 1.0,
      earlyRepaymentAmount: 3000,
    });

    expect(partial.isPartial).toBe(true);
    expect(partial.earlyRepaymentAmount).toBe(3000);
    // 일부상환 시 절약 이자 < 전액상환 시 절약 이자
    expect(partial.interestSaved).toBeGreaterThan(0);
    expect(partial.interestSaved).toBeLessThan(full.interestSaved);
    // 일부상환 후에도 이자가 남음
    expect(partial.interestAfterRepayment).toBeGreaterThan(0);
    // 수수료도 더 적음
    expect(partial.penaltyFee).toBeLessThan(full.penaltyFee);
  });
});
