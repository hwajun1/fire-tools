"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { YearBadge } from "@/components/year-badge";
import { AdSlot } from "@/components/ad-slot";
import { NumberInput } from "@/components/number-input";
import { LottoBall } from "@/components/lotto-ball";
import {
  calcFrequency,
  getTopNumbers,
  getBottomNumbers,
  getRecentMissing,
  generateNumbers,
  LottoRound,
} from "@/lib/lotto";
import lottoData from "@/data/lotto.json";

const data = lottoData as LottoRound[];
const PAGE_SIZE = 20;

export default function LottoPage() {
  const frequency = useMemo(() => calcFrequency(data), []);
  const [weights, setWeights] = useState<number[]>(() => [...frequency]);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [fixed, setFixed] = useState<Set<number>>(new Set());
  const [gameCount, setGameCount] = useState(5);
  const [results, setResults] = useState<number[][]>([]);

  const topNumbers = useMemo(() => getTopNumbers(frequency, 10), [frequency]);
  const bottomNumbers = useMemo(() => getBottomNumbers(frequency, 10), [frequency]);
  const recentMissing = useMemo(() => getRecentMissing(data, 10), []);
  const lastRound = data[data.length - 1];

  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterNumber, setFilterNumber] = useState(0);

  const filteredData = useMemo(() => {
    let filtered = [...data].reverse();
    if (searchQuery) {
      const q = Number(searchQuery);
      if (q > 0) filtered = filtered.filter((r) => r.round === q);
    }
    if (filterNumber > 0) {
      filtered = filtered.filter((r) => r.numbers.includes(filterNumber));
    }
    return filtered;
  }, [searchQuery, filterNumber]);

  const pagedData = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  function handleBallClick(n: number) {
    const newExcluded = new Set(excluded);
    const newFixed = new Set(fixed);

    if (excluded.has(n)) {
      newExcluded.delete(n);
      newFixed.add(n);
    } else if (fixed.has(n)) {
      newFixed.delete(n);
    } else {
      newExcluded.add(n);
    }

    setExcluded(newExcluded);
    setFixed(newFixed);
  }

  function handleGenerate() {
    const effectiveWeights = [...weights];
    excluded.forEach((n) => { effectiveWeights[n] = 0; });

    const games: number[][] = [];
    for (let i = 0; i < gameCount; i++) {
      games.push(generateNumbers(effectiveWeights, [...excluded], [...fixed]));
    }
    setResults(games);
  }

  function handleWeightChange(n: number, value: number) {
    const newWeights = [...weights];
    newWeights[n] = value;
    setWeights(newWeights);
  }

  function handleResetWeights() {
    setWeights([...frequency]);
    setExcluded(new Set());
    setFixed(new Set());
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">로또번호 추출기</h1>
        <YearBadge />
      </div>

      <AdSlot className="mb-4" />

      {/* ===== 번호 생성기 ===== */}
      <Card>
        <CardHeader>
          <CardTitle>번호 생성기</CardTitle>
          <p className="text-sm text-muted-foreground">
            클릭: 제외(회색) → 고정(강조) → 해제. 가중치는 역대 당첨 횟수 기반.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-9 gap-2">
            {Array.from({ length: 45 }, (_, i) => i + 1).map((n) => {
              const isExcluded = excluded.has(n);
              const isFixed = fixed.has(n);
              return (
                <button
                  key={n}
                  onClick={() => handleBallClick(n)}
                  className={`w-10 h-10 rounded-full text-sm font-bold border-2 transition-all
                    ${isExcluded ? "bg-gray-300 text-gray-500 line-through border-gray-400" : ""}
                    ${isFixed ? "ring-2 ring-offset-2 ring-primary border-primary text-white" : ""}
                    ${!isExcluded && !isFixed ? "border-gray-200 hover:border-gray-400" : ""}
                  `}
                  style={
                    isFixed ? { backgroundColor: "#2563EB" } :
                    !isExcluded ? { backgroundColor: "#f9fafb" } : undefined
                  }
                  title={`${n}번 (가중치: ${weights[n]})`}
                >
                  {n}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-gray-300 inline-block" />
              <span className="text-sm">제외</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-primary inline-block" />
              <span className="text-sm">고정</span>
            </div>
            <button
              onClick={handleResetWeights}
              className="text-sm text-primary underline ml-auto"
            >
              초기화
            </button>
          </div>

          <details>
            <summary className="text-sm font-medium cursor-pointer">가중치 직접 조정</summary>
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 mt-2">
              {Array.from({ length: 45 }, (_, i) => i + 1).map((n) => (
                <div key={n} className="text-center">
                  <LottoBall number={n} size="sm" />
                  <input
                    type="number"
                    value={weights[n]}
                    onChange={(e) => handleWeightChange(n, Number(e.target.value) || 0)}
                    className="w-full text-center text-xs border rounded mt-1 p-1"
                    min={0}
                  />
                </div>
              ))}
            </div>
          </details>

          <Separator />

          <div className="flex items-end gap-4">
            <div>
              <Label htmlFor="gameCount">게임 수</Label>
              <NumberInput
                id="gameCount"
                value={gameCount}
                onChange={(v) => setGameCount(Math.max(1, Math.min(10, v)))}
                className="w-20"
              />
            </div>
            <button
              onClick={handleGenerate}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
            >
              번호 생성
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium">생성 결과</p>
              {results.map((game, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-6">{String.fromCharCode(65 + i)}</span>
                  <div className="flex gap-1">
                    {game.map((n) => (
                      <LottoBall key={n} number={n} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== 통계 요약 ===== */}
      <Card>
        <CardHeader>
          <CardTitle>당첨번호 통계</CardTitle>
          <p className="text-sm text-muted-foreground">
            총 {data.length}회차 · 데이터 기준일 {lastRound.date}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">가장 많이 나온 번호 TOP 10</p>
            <div className="flex flex-wrap gap-2">
              {topNumbers.map((s) => (
                <div key={s.number} className="flex flex-col items-center">
                  <LottoBall number={s.number} size="sm" />
                  <span className="text-xs text-muted-foreground">{s.count}회</span>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium mb-2">가장 적게 나온 번호 TOP 10</p>
            <div className="flex flex-wrap gap-2">
              {bottomNumbers.map((s) => (
                <div key={s.number} className="flex flex-col items-center">
                  <LottoBall number={s.number} size="sm" />
                  <span className="text-xs text-muted-foreground">{s.count}회</span>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium mb-2">최근 10회 미출현 번호</p>
            <div className="flex flex-wrap gap-1">
              {recentMissing.map((n) => (
                <LottoBall key={n} number={n} size="sm" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== 역대 당첨번호 ===== */}
      <Card>
        <CardHeader>
          <CardTitle>역대 당첨번호</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div>
              <Label htmlFor="searchRound">회차 검색</Label>
              <NumberInput
                id="searchRound"
                value={Number(searchQuery) || 0}
                onChange={(v) => { setSearchQuery(v > 0 ? String(v) : ""); setPage(0); }}
                className="w-28"
              />
            </div>
            <div>
              <Label htmlFor="filterNum">번호 포함 필터</Label>
              <NumberInput
                id="filterNum"
                value={filterNumber}
                onChange={(v) => { setFilterNumber(v); setPage(0); }}
                className="w-28"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>회차</TableHead>
                  <TableHead>날짜</TableHead>
                  <TableHead>당첨번호</TableHead>
                  <TableHead>보너스</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedData.map((round) => (
                  <TableRow key={round.round}>
                    <TableCell className="font-medium">{round.round}</TableCell>
                    <TableCell className="text-sm">{round.date}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {round.numbers.map((n) => (
                          <LottoBall key={n} number={n} size="sm" />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <LottoBall number={round.bonus} size="sm" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                이전
              </button>
              <span className="text-sm">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <AdSlot className="mt-4" />
    </section>
  );
}
