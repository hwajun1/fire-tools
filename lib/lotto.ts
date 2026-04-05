export interface LottoRound {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
}

export interface NumberStat {
  number: number;
  count: number;
}

/** 1~45 각 번호의 당첨 횟수를 계산. 인덱스 0은 미사용 (항상 0). */
export function calcFrequency(data: LottoRound[]): number[] {
  const freq = new Array(46).fill(0);
  for (const round of data) {
    for (const n of round.numbers) {
      freq[n]++;
    }
  }
  return freq;
}

/** 출현 횟수 상위 N개 번호 */
export function getTopNumbers(freq: number[], n: number): NumberStat[] {
  const stats: NumberStat[] = [];
  for (let i = 1; i <= 45; i++) {
    stats.push({ number: i, count: freq[i] });
  }
  stats.sort((a, b) => b.count - a.count || a.number - b.number);
  return stats.slice(0, n);
}

/** 출현 횟수 하위 N개 번호 */
export function getBottomNumbers(freq: number[], n: number): NumberStat[] {
  const stats: NumberStat[] = [];
  for (let i = 1; i <= 45; i++) {
    stats.push({ number: i, count: freq[i] });
  }
  stats.sort((a, b) => a.count - b.count || a.number - b.number);
  return stats.slice(0, n);
}

/** 최근 lastN 회차에 나오지 않은 번호 목록 */
export function getRecentMissing(data: LottoRound[], lastN: number): number[] {
  const recent = data.slice(-lastN);
  const appeared = new Set<number>();
  for (const round of recent) {
    for (const n of round.numbers) {
      appeared.add(n);
    }
  }
  const missing: number[] = [];
  for (let i = 1; i <= 45; i++) {
    if (!appeared.has(i)) missing.push(i);
  }
  return missing;
}

/** 가중치 기반 번호 1개 추출 (후보 배열에서) */
function weightedPick(candidates: number[], weights: number[]): number {
  const totalWeight = candidates.reduce((sum, n) => sum + weights[n], 0);
  if (totalWeight <= 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  let rand = Math.random() * totalWeight;
  for (const n of candidates) {
    rand -= weights[n];
    if (rand <= 0) return n;
  }
  return candidates[candidates.length - 1];
}

/**
 * 가중치 기반 로또 번호 6개 생성.
 * @param weights - 1~45 번호별 가중치 (index 0은 무시)
 * @param excluded - 제외할 번호 목록
 * @param fixed - 고정 포함할 번호 목록
 * @returns 오름차순 정렬된 6개 번호
 */
export function generateNumbers(
  weights: number[],
  excluded: number[],
  fixed: number[],
): number[] {
  const excludeSet = new Set(excluded);
  const fixedSet = new Set(fixed);
  const result = [...fixedSet];

  const candidates = [];
  for (let i = 1; i <= 45; i++) {
    if (!excludeSet.has(i) && !fixedSet.has(i)) {
      candidates.push(i);
    }
  }

  const remaining = 6 - result.length;
  const pool = [...candidates];

  for (let i = 0; i < remaining; i++) {
    if (pool.length === 0) break;
    const pick = weightedPick(pool, weights);
    result.push(pick);
    pool.splice(pool.indexOf(pick), 1);
  }

  return result.sort((a, b) => a - b);
}

/** 볼 색상 반환 */
export function getBallColor(n: number): string {
  if (n <= 10) return "#FBC400";
  if (n <= 20) return "#69C8F2";
  if (n <= 30) return "#FF7272";
  if (n <= 40) return "#AAAAAA";
  return "#B0D840";
}
