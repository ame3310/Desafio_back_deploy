export function toYYYYMM(year: number, month1to12: number) {
  const m = Math.max(1, Math.min(12, month1to12));
  return `${year}-${String(m).padStart(2, "0")}`;
}
