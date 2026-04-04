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
  annualInvestmentReturn: number;
  annualOpportunityCost: number;
  annualRent: number;
  annualDifference: number; // + 면 월세 유리, - 면 전세 유리
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
