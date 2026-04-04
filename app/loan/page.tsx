"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { YearBadge } from "@/components/year-badge";
import { AdSlot } from "@/components/ad-slot";
import {
  calculateEqualPrincipalInterest,
  calculateEqualPrincipal,
  calculateGraduated,
  analyzeEarlyRepayment,
  LoanResult,
} from "@/lib/loan";
import { formatMoney } from "@/lib/format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function LoanPage() {
  const [principal, setPrincipal] = useState(30000);
  const [annualRate, setAnnualRate] = useState(4.0);
  const [years, setYears] = useState(30);
  const [gracePeriod, setGracePeriod] = useState(0);
  const [repaymentMonth, setRepaymentMonth] = useState(60);
  const [penaltyRate, setPenaltyRate] = useState(1.2);
  const [isPartialRepayment, setIsPartialRepayment] = useState(false);
  const [partialAmount, setPartialAmount] = useState(5000);
  const [showSchedule, setShowSchedule] = useState<string | null>(null);

  const epi = calculateEqualPrincipalInterest(principal, annualRate, years, gracePeriod);
  const ep = calculateEqualPrincipal(principal, annualRate, years, gracePeriod);
  const grad = calculateGraduated(principal, annualRate, years, gracePeriod);

  const earlyResult = analyzeEarlyRepayment({
    principal,
    annualRate,
    totalMonths: years * 12,
    gracePeriod,
    repaymentMonth,
    penaltyRate,
    earlyRepaymentAmount: isPartialRepayment ? partialAmount : undefined,
  });

  // 차트용 데이터 (12개월 단위 샘플링)
  const chartData = epi.schedule
    .filter((_, i) => i % 12 === 0 || i === epi.schedule.length - 1)
    .map((row) => ({
      month: row.month,
      원리금균등: epi.schedule[row.month - 1]?.payment ?? 0,
      원금균등: ep.schedule[row.month - 1]?.payment ?? 0,
      체증식: grad.schedule[row.month - 1]?.payment ?? 0,
    }));

  const interestDiff = Math.round((epi.totalInterest - ep.totalInterest) * 10) / 10;

  const methods: { key: string; label: string; result: LoanResult; desc: string }[] = [
    { key: "epi", label: "원리금균등", result: epi, desc: "매달 같은 금액. 가장 일반적" },
    { key: "ep", label: "원금균등", result: ep, desc: "총이자 적지만 초반 부담 큼" },
    { key: "grad", label: "체증식", result: grad, desc: "초반 부담 적음, 상환액 점차 증가" },
  ];

  function renderSchedule(result: LoanResult) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>회차</TableHead>
            <TableHead className="text-right">상환액</TableHead>
            <TableHead className="text-right">원금</TableHead>
            <TableHead className="text-right">이자</TableHead>
            <TableHead className="text-right">잔액</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.schedule.map((row) => (
            <TableRow key={row.month}>
              <TableCell>{row.month}</TableCell>
              <TableCell className="text-right">{row.payment.toLocaleString()}</TableCell>
              <TableCell className="text-right">{row.principal.toLocaleString()}</TableCell>
              <TableCell className="text-right">{row.interest.toLocaleString()}</TableCell>
              <TableCell className="text-right">{row.balance.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">대출 상환 계산기</h1>
        <YearBadge />
      </div>

      <AdSlot className="mb-4" />

      {/* 입력 */}
      <Card>
        <CardHeader><CardTitle>대출 조건</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="principal">대출 원금 (만원)</Label>
              <Input id="principal" type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} min={0} step={1000} />
            </div>
            <div>
              <Label htmlFor="rate">연 이자율 (%)</Label>
              <Input id="rate" type="number" value={annualRate} onChange={(e) => setAnnualRate(Number(e.target.value))} min={0.1} step={0.1} />
            </div>
            <div>
              <Label htmlFor="years">대출 기간 (년)</Label>
              <Input id="years" type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} min={1} step={1} />
            </div>
            <div>
              <Label htmlFor="grace">거치 기간 (개월)</Label>
              <Input id="grace" type="number" value={gracePeriod} onChange={(e) => setGracePeriod(Number(e.target.value))} min={0} step={1} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3방식 비교 카드 */}
      <div className="grid gap-4 sm:grid-cols-3">
        {methods.map((m) => (
          <Card key={m.key}>
            <CardHeader>
              <CardTitle className="text-base">{m.label}</CardTitle>
              <p className="text-sm text-muted-foreground">{m.desc}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>첫 달 상환액</span>
                <span className="font-medium">{formatMoney(m.result.firstPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span>마지막 달 상환액</span>
                <span className="font-medium">{formatMoney(m.result.lastPayment)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>총 이자</span>
                <span className="font-medium text-red-500">{formatMoney(m.result.totalInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span>총 상환액</span>
                <span className="font-medium">{formatMoney(m.result.totalPayment)}</span>
              </div>
              <button
                className="text-primary underline text-xs mt-2"
                onClick={() => setShowSchedule(showSchedule === m.key ? null : m.key)}
              >
                {showSchedule === m.key ? "상세 스케줄 닫기" : "상세 스케줄 보기"}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 총이자 차이 안내 */}
      <p className="text-sm font-medium">
        원금균등이 원리금균등보다 총 이자 {formatMoney(interestDiff)} 적습니다.
      </p>

      {/* 상세 스케줄 (토글) */}
      {showSchedule && (
        <Card>
          <CardHeader>
            <CardTitle>{methods.find((m) => m.key === showSchedule)?.label} 상환 스케줄</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {renderSchedule(methods.find((m) => m.key === showSchedule)!.result)}
          </CardContent>
        </Card>
      )}

      {/* 차트 */}
      <Card>
        <CardHeader><CardTitle>월 상환액 추이 비교</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <XAxis dataKey="month" label={{ value: "개월", position: "insideBottomRight", offset: -5 }} />
              <YAxis label={{ value: "만원", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(v) => v != null ? `${Number(v).toLocaleString()}만원` : ""} />
              <Legend />
              <Line type="monotone" dataKey="원리금균등" stroke="#2563EB" dot={false} />
              <Line type="monotone" dataKey="원금균등" stroke="#10B981" dot={false} />
              <Line type="monotone" dataKey="체증식" stroke="#F59E0B" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 조기상환 분석 */}
      <Card>
        <CardHeader><CardTitle>조기상환 손익 분석</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="repayMonth">조기상환 시점 (개월차)</Label>
              <Input id="repayMonth" type="number" value={repaymentMonth} onChange={(e) => setRepaymentMonth(Number(e.target.value))} min={1} max={years * 12} step={1} />
            </div>
            <div>
              <Label htmlFor="penalty">조기상환수수료율 (%)</Label>
              <Input id="penalty" type="number" value={penaltyRate} onChange={(e) => setPenaltyRate(Number(e.target.value))} min={0} step={0.1} />
            </div>
            <div>
              <Label>상환 범위</Label>
              <div className="flex gap-2 mt-1">
                <button
                  className={`flex-1 rounded-md border px-3 py-2 text-sm ${!isPartialRepayment ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setIsPartialRepayment(false)}
                >
                  전액 상환
                </button>
                <button
                  className={`flex-1 rounded-md border px-3 py-2 text-sm ${isPartialRepayment ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setIsPartialRepayment(true)}
                >
                  일부 상환
                </button>
              </div>
            </div>
            {isPartialRepayment && (
              <div>
                <Label htmlFor="partialAmount">조기상환 금액 (만원)</Label>
                <Input id="partialAmount" type="number" value={partialAmount} onChange={(e) => setPartialAmount(Number(e.target.value))} min={0} step={100} />
              </div>
            )}
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{repaymentMonth}개월차 잔액</span>
              <span className="font-medium">{formatMoney(earlyResult.remainingBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span>조기상환 금액</span>
              <span className="font-medium">{formatMoney(earlyResult.earlyRepaymentAmount)}{earlyResult.isPartial ? " (일부)" : " (전액)"}</span>
            </div>
            <div className="flex justify-between">
              <span>조기상환 없을 때 남은 이자</span>
              <span className="font-medium">{formatMoney(earlyResult.remainingInterest)}</span>
            </div>
            {earlyResult.isPartial && (
              <div className="flex justify-between">
                <span>일부상환 후 남은 이자</span>
                <span className="font-medium">{formatMoney(earlyResult.interestAfterRepayment)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>절약되는 이자</span>
              <span className="font-medium text-green-600">{formatMoney(earlyResult.interestSaved)}</span>
            </div>
            <div className="flex justify-between">
              <span>조기상환수수료</span>
              <span className="font-medium text-red-500">{formatMoney(earlyResult.penaltyFee)}</span>
            </div>
            <Separator />
            <p className={`text-xl font-bold ${earlyResult.netSaving > 0 ? "text-green-600" : "text-red-600"}`}>
              {earlyResult.netSaving > 0
                ? `${earlyResult.isPartial ? "일부 상환하면" : "지금 갚으면"} ${formatMoney(earlyResult.netSaving)} 이득`
                : `수수료가 더 크므로 ${formatMoney(Math.abs(earlyResult.netSaving))} 손해`}
            </p>
            {earlyResult.breakevenMonth > 0 && (
              <p className="text-sm text-muted-foreground">
                {earlyResult.breakevenMonth}개월차 이후부터 갚으면 이득입니다.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AdSlot className="mt-4" />
    </section>
  );
}
