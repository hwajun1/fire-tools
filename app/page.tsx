import { ToolCard } from "@/components/tool-card";

const tools = [
  {
    title: "FIRE 은퇴 계산기",
    description: "나는 몇 년 뒤에 은퇴할 수 있을까? 자산 추이 시뮬레이션",
    href: "https://fire-calculator-1.streamlit.app/",
    external: true,
  },
  {
    title: "연봉 실수령액 계산기",
    description: "4대보험 + 소득세 공제 후 실제 수령액 계산",
    href: "/salary",
  },
  {
    title: "전월세 전환 계산기",
    description: "전세↔월세 전환 금액 및 손익 분석",
    href: "/rent-convert",
  },
  {
    title: "대출 상환 계산기",
    description: "원리금균등·원금균등·체증식 비교 + 조기상환 분석",
    href: "/loan",
  },
  {
    title: "로또번호 추출기",
    description: "계획대로 안 될 때의 플랜 B. 당첨 통계 기반 번호 생성",
    href: "/lotto",
  },
];

export default function Home() {
  return (
    <section>
      <h1 className="text-2xl font-bold mb-6">재테크 도구 모음</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <ToolCard key={tool.href} {...tool} />
        ))}
      </div>
    </section>
  );
}
