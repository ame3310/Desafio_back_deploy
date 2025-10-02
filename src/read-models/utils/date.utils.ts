export function ym(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function ytdMonths(d = new Date()): string[] {
  const y = d.getFullYear();
  const months: string[] = [];
  for (let i = 0; i <= d.getMonth(); i++) {
    const mm = String(i + 1).padStart(2, "0");
    months.push(`${y}-${mm}`);
  }
  return months;
}

export function thisYear(d = new Date()) {
  return d.getFullYear();
}
