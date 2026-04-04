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
  earlyRepaymentAmount?: number; // 조기상환 금액 (만원). 미지정 시 잔액 전액
}

export interface EarlyRepaymentResult {
  remainingBalance: number;
  earlyRepaymentAmount: number; // 실제 조기상환 금액
  isPartial: boolean;           // 일부상환 여부
  remainingInterest: number;    // 조기상환 안 했을 때 남은 이자
  interestAfterRepayment: number; // 일부상환 후 남은 이자
  interestSaved: number;        // 절약되는 이자
  penaltyFee: number;
  netSaving: number;
  breakevenMonth: number;
}

/** 일부상환 후 남은 스케줄의 이자 합계를 계산 */
function calcInterestAfterPartialRepayment(
  remainingBalance: number,
  repayAmount: number,
  annualRate: number,
  remainingMonths: number,
): number {
  const newBalance = remainingBalance - repayAmount;
  if (newBalance <= 0 || remainingMonths <= 0) return 0;

  // 줄어든 원금으로 원리금균등 재계산
  const monthlyRate = annualRate / 100 / 12;
  const pmt = newBalance * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths) /
    (Math.pow(1 + monthlyRate, remainingMonths) - 1);

  let balance = newBalance;
  let totalInterest = 0;

  for (let m = 0; m < remainingMonths; m++) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    const principalPart = pmt - interest;
    balance -= principalPart;
    if (balance < 0) balance = 0;
  }

  return r1(totalInterest);
}

export function analyzeEarlyRepayment(input: EarlyRepaymentInput): EarlyRepaymentResult {
  const { principal, annualRate, totalMonths, gracePeriod, repaymentMonth, penaltyRate } = input;
  const years = totalMonths / 12;

  // 원리금균등 기준으로 분석
  const full = calculateEqualPrincipalInterest(principal, annualRate, years, gracePeriod);

  const monthIndex = Math.min(repaymentMonth - 1, full.schedule.length - 1);
  const remainingBalance = full.schedule[monthIndex].balance;

  // 조기상환 금액 결정 (미지정이면 전액)
  const repayAmount = input.earlyRepaymentAmount != null
    ? Math.min(input.earlyRepaymentAmount, remainingBalance)
    : remainingBalance;
  const isPartial = repayAmount < remainingBalance;

  // 조기상환 안 했을 때 남은 이자
  const remainingInterest = r1(
    full.schedule.slice(repaymentMonth).reduce((s, r) => s + r.interest, 0)
  );

  // 일부상환 후 남은 이자
  const remainingMonths = totalMonths - repaymentMonth;
  const interestAfterRepayment = isPartial
    ? calcInterestAfterPartialRepayment(remainingBalance, repayAmount, annualRate, remainingMonths)
    : 0;

  const interestSaved = r1(remainingInterest - interestAfterRepayment);
  const penaltyFee = r1(repayAmount * (penaltyRate / 100));
  const netSaving = r1(interestSaved - penaltyFee);

  // 손익분기점 찾기
  let breakevenMonth = 0;
  for (let m = 1; m < full.schedule.length; m++) {
    const bal = full.schedule[m - 1].balance;
    const amt = input.earlyRepaymentAmount != null ? Math.min(input.earlyRepaymentAmount, bal) : bal;
    const fee = amt * (penaltyRate / 100);
    const remMonths = totalMonths - m;
    const origInt = full.schedule.slice(m).reduce((s, r) => s + r.interest, 0);
    const newInt = amt < bal
      ? calcInterestAfterPartialRepayment(bal, amt, annualRate, remMonths)
      : 0;
    const saved = origInt - newInt;
    if (saved > fee) {
      breakevenMonth = m;
      break;
    }
  }

  return {
    remainingBalance,
    earlyRepaymentAmount: repayAmount,
    isPartial,
    remainingInterest,
    interestAfterRepayment,
    interestSaved,
    penaltyFee,
    netSaving,
    breakevenMonth,
  };
}
