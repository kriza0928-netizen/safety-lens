const USAGE_KEY = "safety-lens-ai-usage";
const MAX_DAILY_USES = 15;
const COOLDOWN_MS = 15_000;

interface UsageRecord {
  date: string;
  count: number;
  lastRequestAt: number;
}

function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

function getUsageRecord(): UsageRecord {
  if (typeof window === "undefined") {
    return { date: todayKey(), count: 0, lastRequestAt: 0 };
  }

  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) {
      return { date: todayKey(), count: 0, lastRequestAt: 0 };
    }

    const parsed = JSON.parse(raw) as UsageRecord;
    if (parsed.date !== todayKey()) {
      return { date: todayKey(), count: 0, lastRequestAt: 0 };
    }

    return parsed;
  } catch {
    return { date: todayKey(), count: 0, lastRequestAt: 0 };
  }
}

function saveUsageRecord(record: UsageRecord): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(record));
}

export function getRemainingDailyUses(): number {
  const record = getUsageRecord();
  return Math.max(0, MAX_DAILY_USES - record.count);
}

export function checkAiUsageAllowed(): { allowed: true } | { allowed: false; reason: string } {
  const record = getUsageRecord();
  const now = Date.now();

  if (record.count >= MAX_DAILY_USES) {
    return {
      allowed: false,
      reason: `오늘 AI 분석 한도(${MAX_DAILY_USES}회)를 모두 사용했습니다. 내일 다시 시도하거나 데모 모드를 이용해 주세요.`,
    };
  }

  const elapsed = now - record.lastRequestAt;
  if (record.lastRequestAt > 0 && elapsed < COOLDOWN_MS) {
    const waitSec = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    return {
      allowed: false,
      reason: `무료 한도 보호를 위해 ${waitSec}초 후 다시 시도해 주세요.`,
    };
  }

  return { allowed: true };
}

export function recordAiUsage(): void {
  const record = getUsageRecord();
  saveUsageRecord({
    date: todayKey(),
    count: record.count + 1,
    lastRequestAt: Date.now(),
  });
}

export const AI_USAGE_LIMIT = MAX_DAILY_USES;
