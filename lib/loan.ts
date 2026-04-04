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

const r1 = (v: number) => Math.round(v * 10) / 10;

/** 원리금균등 상환 */
export function calculateEqualPrincipalInterest(
  principal: number, annualRate: number, years: number, gracePeriod: number
): LoanResult {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;
  const repayMonths = totalMonths - gracePeriod;
  const schedule: ScheduleRow[] = [];
  // Keep balance as precise float to avoid rounding drift
  let balance = principal;

  // PMT for repayment period
  const pmt = repayMonths > 0
    ? principal * monthlyRate * Math.pow(1 + monthlyRate, repayMonths) /
      (Math.pow(1 + monthlyRate, repayMonths) - 1)
    : 0;

  for (let m = 1; m <= totalMonths; m++) {
    const interestExact = balance * monthlyRate;
    const interest = r1(interestExact);

    if (m <= gracePeriod) {
      schedule.push({ month: m, payment: interest, principal: 0, interest, balance: r1(balance) });
    } else {
      const principalExact = pmt - interestExact;
      balance -= principalExact;
      if (balance < 0) balance = 0;
      schedule.push({
        month: m,
        payment: r1(pmt),
        principal: r1(principalExact),
        interest,
        balance: r1(balance),
      });
    }
  }

  const totalPayment = r1(schedule.reduce((s, r) => s + r.payment, 0));

  return {
    schedule,
    totalPayment,
    totalInterest: r1(totalPayment - principal),
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
    const interestExact = balance * monthlyRate;
    const interest = r1(interestExact);

    if (m <= gracePeriod) {
      schedule.push({ month: m, payment: interest, principal: 0, interest, balance: r1(balance) });
    } else {
      balance -= monthlyPrincipal;
      if (balance < 0) balance = 0;
      const payment = r1(monthlyPrincipal + interestExact);
      schedule.push({ month: m, payment, principal: r1(monthlyPrincipal), interest, balance: r1(balance) });
    }
  }

  const totalPayment = r1(schedule.reduce((s, r) => s + r.payment, 0));

  return {
    schedule,
    totalPayment,
    totalInterest: r1(totalPayment - principal),
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
    const interestExact = balance * monthlyRate;
    const interest = r1(interestExact);

    if (m <= gracePeriod) {
      schedule.push({ month: m, payment: interest, principal: 0, interest, balance: r1(balance) });
    } else {
      repayIndex++;
      const pPartExact = d * repayIndex;
      balance -= pPartExact;
      if (balance < 0) balance = 0;
      const payment = r1(pPartExact + interestExact);
      schedule.push({ month: m, payment, principal: r1(pPartExact), interest, balance: r1(balance) });
    }
  }

  const totalPayment = r1(schedule.reduce((s, r) => s + r.payment, 0));

  return {
    schedule,
    totalPayment,
    totalInterest: r1(totalPayment - principal),
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
  repaymentMonth: number;
  penaltyRate: number; // %
}

export interface EarlyRepaymentResult {
  remainingBalance: number;
  remainingInterest: number;
  penaltyFee: number;
  netSaving: number;
  breakevenMonth: number;
}

export function analyzeEarlyRepayment(input: EarlyRepaymentInput): EarlyRepaymentResult {
  const { principal, annualRate, totalMonths, gracePeriod, repaymentMonth, penaltyRate } = input;
  const years = totalMonths / 12;

  // 원리금균등 기준으로 분석
  const full = calculateEqualPrincipalInterest(principal, annualRate, years, gracePeriod);

  const monthIndex = Math.min(repaymentMonth - 1, full.schedule.length - 1);
  const remainingBalance = full.schedule[monthIndex].balance;

  const remainingInterest = r1(
    full.schedule.slice(repaymentMonth).reduce((s, r) => s + r.interest, 0)
  );

  const penaltyFee = r1(remainingBalance * (penaltyRate / 100));
  const netSaving = r1(remainingInterest - penaltyFee);

  // 손익분기점 찾기
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
