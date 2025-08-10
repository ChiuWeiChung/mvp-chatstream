import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stringToColor(input: string): string {
  // Step 1: 建立 hash
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // 保證是 32-bit 整數
  }

  // Step 2: 將 hash 映射到 RGB
  const r = (hash >> 16) & 0xff;
  const g = (hash >> 8) & 0xff;
  const b = hash & 0xff;

  // Step 3: 輸出 HEX 色碼
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}