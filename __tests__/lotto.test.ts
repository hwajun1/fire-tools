import { describe, it, expect } from "vitest";
import {
  calcFrequency,
  getTopNumbers,
  getBottomNumbers,
  getRecentMissing,
  generateNumbers,
} from "@/lib/lotto";

const sampleData = [
  { round: 1, date: "2002-12-07", numbers: [10, 23, 29, 33, 37, 40], bonus: 16 },
  { round: 2, date: "2002-12-14", numbers: [9, 13, 21, 25, 32, 42], bonus: 2 },
  { round: 3, date: "2002-12-21", numbers: [11, 16, 19, 21, 27, 31], bonus: 30 },
];

describe("calcFrequency", () => {
  it("counts frequency of each number", () => {
    const freq = calcFrequency(sampleData);
    expect(freq[21]).toBe(2);
    expect(freq[10]).toBe(1);
    expect(freq[1]).toBe(0);
  });

  it("returns array of length 46 (index 0 unused)", () => {
    const freq = calcFrequency(sampleData);
    expect(freq).toHaveLength(46);
    expect(freq[0]).toBe(0);
  });
});

describe("getTopNumbers", () => {
  it("returns top N numbers by frequency", () => {
    const freq = calcFrequency(sampleData);
    const top = getTopNumbers(freq, 3);
    expect(top).toHaveLength(3);
    expect(top[0].count).toBeGreaterThanOrEqual(top[1].count);
  });
});

describe("getBottomNumbers", () => {
  it("returns bottom N numbers by frequency", () => {
    const freq = calcFrequency(sampleData);
    const bottom = getBottomNumbers(freq, 3);
    expect(bottom).toHaveLength(3);
    expect(bottom[0].count).toBeLessThanOrEqual(bottom[1].count);
  });
});

describe("getRecentMissing", () => {
  it("finds numbers not in last N rounds", () => {
    const missing = getRecentMissing(sampleData, 1);
    expect(missing).not.toContain(11);
    expect(missing).not.toContain(21);
    expect(missing).toContain(10);
  });
});

describe("generateNumbers", () => {
  it("generates 6 unique numbers between 1-45", () => {
    const weights = new Array(46).fill(1);
    weights[0] = 0;
    const result = generateNumbers(weights, [], []);
    expect(result).toHaveLength(6);
    expect(new Set(result).size).toBe(6);
    result.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(45);
    });
  });

  it("returns sorted numbers", () => {
    const weights = new Array(46).fill(1);
    weights[0] = 0;
    const result = generateNumbers(weights, [], []);
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(result[i - 1]);
    }
  });

  it("respects fixed numbers", () => {
    const weights = new Array(46).fill(1);
    weights[0] = 0;
    const result = generateNumbers(weights, [], [7, 24]);
    expect(result).toContain(7);
    expect(result).toContain(24);
    expect(result).toHaveLength(6);
  });

  it("excludes excluded numbers", () => {
    const weights = new Array(46).fill(1);
    weights[0] = 0;
    const result = generateNumbers(weights, [1, 2, 3, 4, 5], []);
    expect(result).not.toContain(1);
    expect(result).not.toContain(2);
    expect(result).not.toContain(3);
  });

  it("includes fixed and excludes excluded simultaneously", () => {
    const weights = new Array(46).fill(1);
    weights[0] = 0;
    const result = generateNumbers(weights, [1, 2, 3], [10, 20]);
    expect(result).toContain(10);
    expect(result).toContain(20);
    expect(result).not.toContain(1);
    expect(result).toHaveLength(6);
  });
});
