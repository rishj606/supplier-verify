// Daily spend guard — hard cap on API calls per day
// Prevents runaway costs even if rate limiting is bypassed

interface DailyUsage {
  date: string;
  claudeCalls: number;
  gstCalls: number;
}

// Configurable daily limits
const DAILY_LIMITS = {
  claude: parseInt(process.env.DAILY_CLAUDE_LIMIT || "100"),
  gst: parseInt(process.env.DAILY_GST_LIMIT || "100"),
};

let usage: DailyUsage = {
  date: new Date().toISOString().split("T")[0],
  claudeCalls: 0,
  gstCalls: 0,
};

function resetIfNewDay() {
  const today = new Date().toISOString().split("T")[0];
  if (usage.date !== today) {
    usage = { date: today, claudeCalls: 0, gstCalls: 0 };
  }
}

export function canCallClaude(): boolean {
  resetIfNewDay();
  return usage.claudeCalls < DAILY_LIMITS.claude;
}

export function canCallGST(): boolean {
  resetIfNewDay();
  return usage.gstCalls < DAILY_LIMITS.gst;
}

export function recordClaudeCall() {
  resetIfNewDay();
  usage.claudeCalls++;
  console.log(
    `[Spend] Claude calls today: ${usage.claudeCalls}/${DAILY_LIMITS.claude}`
  );
}

export function recordGSTCall() {
  resetIfNewDay();
  usage.gstCalls++;
  console.log(
    `[Spend] GST calls today: ${usage.gstCalls}/${DAILY_LIMITS.gst}`
  );
}

export function getUsage() {
  resetIfNewDay();
  return {
    date: usage.date,
    claude: { used: usage.claudeCalls, limit: DAILY_LIMITS.claude },
    gst: { used: usage.gstCalls, limit: DAILY_LIMITS.gst },
  };
}
