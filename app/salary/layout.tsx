import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "연봉 실수령액 계산기 2026",
  description: "2026년 기준 연봉 실수령액 계산기. 4대보험, 소득세 공제 후 월 실수령액을 바로 확인하세요. 연봉 5천만원~1억5천만원 참고표 제공.",
  keywords: ["연봉 실수령액", "2026 연봉 계산기", "실수령액 계산기", "4대보험 계산", "소득세 계산"],
  openGraph: {
    title: "연봉 실수령액 계산기 2026 | FIRE Tools",
    description: "4대보험 + 소득세 공제 후 월 실수령액 계산",
  },
};

export default function SalaryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
