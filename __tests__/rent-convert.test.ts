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
    // 월세 전환이 연 300만원 이익
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
