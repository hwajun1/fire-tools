/**
 * 동행복권 API에서 로또 당첨번호를 가져와 data/lotto.json에 저장.
 * 사용법: npx tsx scripts/update-lotto.ts
 */
import fs from "fs";
import path from "path";

interface LottoRound {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
}

const DATA_PATH = path.join(process.cwd(), "data", "lotto.json");
const API_URL = "https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=";

async function fetchRound(round: number): Promise<LottoRound | null> {
  const res = await fetch(`${API_URL}${round}`);
  const data = await res.json();
  if (data.returnValue !== "success") return null;

  const numbers = [
    data.drwtNo1, data.drwtNo2, data.drwtNo3,
    data.drwtNo4, data.drwtNo5, data.drwtNo6,
  ].sort((a, b) => a - b);

  return {
    round: data.drwNo,
    date: data.drwNoDate,
    numbers,
    bonus: data.bnusNo,
  };
}

async function main() {
  let existing: LottoRound[] = [];
  if (fs.existsSync(DATA_PATH)) {
    existing = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  }

  const lastRound = existing.length > 0 ? existing[existing.length - 1].round : 0;

  let current = lastRound + 1;
  let newRounds: LottoRound[] = [];

  while (true) {
    const result = await fetchRound(current);
    if (!result) break;
    newRounds.push(result);
    console.log(`Fetched round ${current}: ${result.numbers.join(", ")} + ${result.bonus}`);
    current++;
    await new Promise((r) => setTimeout(r, 200));
  }

  if (newRounds.length === 0) {
    console.log("No new rounds found.");
    return;
  }

  const allData = [...existing, ...newRounds];
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(allData, null, 2));
  console.log(`Updated: ${allData.length} total rounds (${newRounds.length} new)`);
}

main().catch(console.error);
