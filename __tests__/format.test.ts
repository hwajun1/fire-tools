import { describe, it, expect } from "vitest";
import { formatMoney, formatPercent } from "@/lib/format";

describe("formatMoney", () => {
  it("formats 만원 under 1억", () => {
    expect(formatMoney(5000)).toBe("5,000만원");
  });

  it("formats 억원 at 1억+", () => {
    expect(formatMoney(10000)).toBe("1.0억원");
  });

  it("formats 억원 with decimals", () => {
    expect(formatMoney(25000)).toBe("2.5억원");
  });

  it("formats 0", () => {
    expect(formatMoney(0)).toBe("0만원");
  });
});

describe("formatPercent", () => {
  it("formats ratio as percent", () => {
    expect(formatPercent(0.851)).toBe("85.1%");
  });
});
