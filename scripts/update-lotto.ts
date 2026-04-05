/**
 * 로또 당첨번호를 가져와 data/lotto.json에 저장.
 * 소스: smok95.github.io/lotto (GitHub Pages 공개 데이터)
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

interface ApiRound {
  draw_no: number;
  date: string;
  numbers: number[];
  bonus_no: number;
}

const DATA_PATH = path.join(process.cwd(), "data", "lotto.json");
const ALL_URL = "https://smok95.github.io/lotto/results/all.json";

function toRound(api: ApiRound): LottoRound {
  return {
    round: api.draw_no,
    date: api.date.split("T")[0], // "2002-12-07T00:00:00Z" → "2002-12-07"
    numbers: [...api.numbers].sort((a, b) => a - b),
    bonus: api.bonus_no,
  };
}

async function main() {
  console.log("Fetching all lotto data...");
  const res = await fetch(ALL_URL);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

  const apiData: ApiRound[] = await res.json();
  const allData = apiData.map(toRound).sort((a, b) => a.round - b.round);

  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(allData, null, 2));
  console.log(`Updated: ${allData.length} total rounds (1~${allData[allData.length - 1].round})`);
}

main().catch(console.error);
