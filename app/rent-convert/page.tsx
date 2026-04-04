"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { YearBadge } from "@/components/year-badge";
import { AdSlot } from "@/components/ad-slot";
import { convertRent, RentConvertResult } from "@/lib/rent-convert";
import { formatMoney } from "@/lib/format";
import {
  DEFAULT_RENT_CONVERSION_RATE,
  DEFAULT_INVESTMENT_RETURN_RATE,
} from "@/lib/constants";

export default function RentConvertPage() {
  const [direction, setDirection] = useState<"jeonse-to-monthly" | "monthly-to-jeonse">("jeonse-to-monthly");
  const [jeonse, setJeonse] = useState(30000);
  const [deposit, setDeposit] = useState(10000);
  const [monthlyRent, setMonthlyRent] = useState(50);
  const [conversionRate, setConversionRate] = useState(DEFAULT_RENT_CONVERSION_RATE);
  const [investmentReturnRate, setInvestmentReturnRate] = useState(DEFAULT_INVESTMENT_RETURN_RATE);

  const result: RentConvertResult = convertRent(
    direction === "jeonse-to-monthly"
      ? { direction, jeonse, deposit, conversionRate, investmentReturnRate }
      : { direction, deposit, monthlyRent, conversionRate, investmentReturnRate }
  );

  const analysis = result.profitAnalysis;
  const isMonthlyBetter = analysis.recommendation === "monthly";
  const absDiff = Math.abs(analysis.annualDifference);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">전월세 전환 계산기</h1>
        <YearBadge />
      </div>

      <AdSlot className="mb-4" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 입력 */}
        <Card>
          <CardHeader>
            <CardTitle>입력</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>전환 방향</Label>
              <div className="flex gap-2 mt-1">
                <button
                  className={`flex-1 rounded-md border px-3 py-2 text-sm ${direction === "jeonse-to-monthly" ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setDirection("jeonse-to-monthly")}
                >
                  전세 → 월세
                </button>
                <button
                  className={`flex-1 rounded-md border px-3 py-2 text-sm ${direction === "monthly-to-jeonse" ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setDirection("monthly-to-jeonse")}
                >
                  월세 → 전세
                </button>
              </div>
            </div>

            {direction === "jeonse-to-monthly" && (
              <div>
                <Label htmlFor="jeonse">전세금 (만원)</Label>
                <Input id="jeonse" type="number" value={jeonse} onChange={(e) => setJeonse(Number(e.target.value))} min={0} step={1000} />
              </div>
            )}

            <div>
              <Label htmlFor="deposit">보증금 (만원)</Label>
              <Input id="deposit" type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} min={0} step={1000} />
            </div>

            {direction === "monthly-to-jeonse" && (
              <div>
                <Label htmlFor="monthly">월세 (만원)</Label>
                <Input id="monthly" type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(Number(e.target.value))} min={0} step={5} />
              </div>
            )}

            <div>
              <Label htmlFor="rate">전월세 전환율 (%)</Label>
              <Input id="rate" type="number" value={conversionRate} onChange={(e) => setConversionRate(Number(e.target.value))} min={0.1} step={0.1} />
            </div>

            <div>
              <Label htmlFor="invest">예상 투자 수익률 (%)</Label>
              <Input id="invest" type="number" value={investmentReturnRate} onChange={(e) => setInvestmentReturnRate(Number(e.target.value))} min={0} step={0.5} />
            </div>
          </CardContent>
        </Card>

        {/* 결과 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>전환 결과</CardTitle>
            </CardHeader>
            <CardContent>
              {direction === "jeonse-to-monthly" ? (
                <>
                  <p className="text-sm text-muted-foreground">환산 월세</p>
                  <p className="text-4xl font-bold text-primary">{formatMoney(result.monthlyRent)}</p>
                  <p className="text-sm text-muted-foreground mt-1">연간 월세 총액: {formatMoney(result.annualRent)}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">환산 전세금</p>
                  <p className="text-4xl font-bold text-primary">{formatMoney(result.jeonse)}</p>
                  <p className="text-sm text-muted-foreground mt-1">연간 월세 총액: {formatMoney(result.annualRent)}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>손익 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${isMonthlyBetter ? "text-blue-600" : "text-green-600"}`}>
                {isMonthlyBetter ? "월세" : "전세"}가 연 {formatMoney(absDiff)} 이득
              </p>
              <Separator className="my-3" />
              {direction === "jeonse-to-monthly" && result.direction === "jeonse-to-monthly" && (
                <div className="space-y-1 text-sm">
                  <p>여유 자금: {formatMoney(result.freeCapital)}</p>
                  <p>여유 자금 투자 수익 (연): {formatMoney(analysis.annualInvestmentReturn)}</p>
                  <p>연간 월세 지출: {formatMoney(analysis.annualRent)}</p>
                </div>
              )}
              {direction === "monthly-to-jeonse" && result.direction === "monthly-to-jeonse" && (
                <div className="space-y-1 text-sm">
                  <p>추가 보증금: {formatMoney(result.additionalDeposit)}</p>
                  <p>보증금 기회비용 (연): {formatMoney(analysis.annualOpportunityCost)}</p>
                  <p>절약되는 월세 (연): {formatMoney(analysis.annualRent)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        * 전월세 전환율은 한국은행 기준입니다. 실제 전환율은 지역과 시기에 따라 다를 수 있습니다.
      </p>

      <AdSlot className="mt-4" />
    </section>
  );
}
