import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대출 상환 계산기 2026",
  description: "원리금균등·원금균등·체증식 3가지 상환 방식 비교 + 조기상환 손익 분석. 대출 상환 계획을 한눈에.",
  keywords: ["대출 상환 계산기", "원리금균등", "원금균등", "체증식", "조기상환", "대출 이자 계산"],
  openGraph: {
    title: "대출 상환 계산기 2026 | FIRE Tools",
    description: "3가지 상환 방식 비교 + 조기상환 손익 분석",
  },
};

export default function LoanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
