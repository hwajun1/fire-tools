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
