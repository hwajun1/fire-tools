"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { YearBadge } from "@/components/year-badge";
import { AdSlot } from "@/components/ad-slot";
import { calculateSalary, calculateSalaryTable } from "@/lib/salary";
import { formatMoney, formatPercent } from "@/lib/format";

const salaryTable = calculateSalaryTable();

export default function SalaryPage() {
  const [annualSalary, setAnnualSalary] = useState(5000);
  const [monthlyTaxFree, setMonthlyTaxFree] = useState(20);
  const [dependents, setDependents] = useState(1);
  const [childrenUnder20, setChildrenUnder20] = useState(0);

  const result = calculateSalary({
    annualSalary,
    monthlyTaxFree,
    dependents,
    childrenUnder20,
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">연봉 실수령액 계산기</h1>
        <YearBadge />
      </div>

      <AdSlot className="mb-4" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 입력 */}
        <Card>
          <CardHeader>
            <CardTitle>입력</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="salary">연봉 (만원)</Label>
              <Input
                id="salary"
                type="number"
                value={annualSalary}
                onChange={(e) => setAnnualSalary(Number(e.target.value))}
                min={0}
                step={100}
              />
            </div>
            <div>
              <Label htmlFor="taxfree">비과세액 (월, 만원)</Label>
              <Input
                id="taxfree"
                type="number"
                value={monthlyTaxFree}
                onChange={(e) => setMonthlyTaxFree(Number(e.target.value))}
                min={0}
                step={10}
              />
            </div>
            <div>
              <Label htmlFor="dependents">부양가족 수 (본인 포함)</Label>
              <Input
                id="dependents"
                type="number"
                value={dependents}
                onChange={(e) => setDependents(Number(e.target.value))}
                min={1}
                step={1}
              />
            </div>
            <div>
              <Label htmlFor="children">20세 이하 자녀 수</Label>
              <Input
                id="children"
                type="number"
                value={childrenUnder20}
                onChange={(e) => setChildrenUnder20(Number(e.target.value))}
                min={0}
                step={1}
              />
            </div>
          </CardContent>
        </Card>

        {/* 결과 */}
        <Card>
          <CardHeader>
            <CardTitle>월 실수령액</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary mb-2">
              {formatMoney(result.netSalary)}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              연봉 대비 {formatPercent(result.netRatio)}
            </p>
            <Separator className="my-4" />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>공제 항목</TableHead>
                  <TableHead className="text-right">금액 (만원)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>국민연금</TableCell>
                  <TableCell className="text-right">{result.nationalPension.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>건강보험</TableCell>
                  <TableCell className="text-right">{result.healthInsurance.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>장기요양보험</TableCell>
                  <TableCell className="text-right">{result.longTermCare.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>고용보험</TableCell>
                  <TableCell className="text-right">{result.employmentInsurance.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>소득세</TableCell>
                  <TableCell className="text-right">{result.incomeTax.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>지방소득세</TableCell>
                  <TableCell className="text-right">{result.localIncomeTax.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow className="font-bold">
                  <TableCell>공제 합계</TableCell>
                  <TableCell className="text-right">{result.totalDeduction.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 연봉별 참고표 */}
        <Card>
          <CardHeader>
            <CardTitle>연봉별 실수령액 참고표</CardTitle>
            <p className="text-sm text-muted-foreground">부양가족 1인(본인) 기준</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>연봉</TableHead>
                  <TableHead className="text-right">월 실수령액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryTable.map((row) => (
                  <TableRow key={row.annualSalary}>
                    <TableCell>{formatMoney(row.annualSalary)}</TableCell>
                    <TableCell className="text-right">{formatMoney(row.netSalary)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        * 근사치이며 실제 급여와 차이가 있을 수 있습니다. 간이세액표 기반 근사 계산입니다.
      </p>

      <AdSlot className="mt-4" />
    </section>
  );
}
