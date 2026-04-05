import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로또번호 추출기 — 가중치 기반 번호 생성 + 역대 당첨번호",
  description: "역대 당첨 통계 기반 가중치로 로또번호 추출. 번호별 출현 횟수, 역대 당첨번호 조회.",
  keywords: ["로또번호 생성기", "로또 추출기", "로또 당첨번호", "로또 번호 추천", "로또 통계"],
  openGraph: {
    title: "로또번호 추출기 | FIRE Tools",
    description: "당첨 통계 기반 가중치로 로또번호 추출 + 역대 당첨번호 조회",
  },
};

export default function LottoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
