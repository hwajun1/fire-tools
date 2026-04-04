import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "전월세 전환 계산기 2026",
  description: "전세↔월세 전환 계산기. 전월세 전환율 기반 환산 + 투자 수익률 대비 손익 분석까지 한 번에.",
  keywords: ["전월세 전환", "전월세 전환 계산기", "전세 월세 비교", "전월세 전환율 2026"],
  openGraph: {
    title: "전월세 전환 계산기 2026 | FIRE Tools",
    description: "전세↔월세 전환 금액 및 손익 분석",
  },
};

export default function RentConvertLayout({ children }: { children: React.ReactNode }) {
  return children;
}
