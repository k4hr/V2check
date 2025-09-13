let opened: string[] = [];
const LIMIT = 3;

export function canOpen(id: string): boolean {
  return opened.includes(id) || opened.length < LIMIT;
}

export function registerOpen(id: string) {
  if (!opened.includes(id)) opened.push(id);
}

export function remaining(): number {
  return Math.max(0, LIMIT - opened.length);
}