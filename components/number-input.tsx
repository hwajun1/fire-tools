"use client";

import { Input } from "@/components/ui/input";
import { ComponentProps } from "react";

interface NumberInputProps extends Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: number;
  onChange: (value: number) => void;
}

/**
 * 숫자 전용 입력 컴포넌트.
 * - 앞에 0이 붙지 않음 (0240 → 240)
 * - 빈 값은 0으로 처리
 */
export function NumberInput({ value, onChange, ...props }: NumberInputProps) {
  return (
    <Input
      type="text"
      inputMode="decimal"
      value={String(value)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9.\-]/g, "");
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        onChange(Number(cleaned) || 0);
      }}
      {...props}
    />
  );
}
