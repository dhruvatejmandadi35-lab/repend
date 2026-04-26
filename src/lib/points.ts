import { supabase } from "@/integrations/supabase/client";

function dateOnly(d: Date): string {
  return d.toISOString().split("T")[0];
}

function todayStr(): string {
  return dateOnly(new Date());
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateOnly(d);
}

export interface AwardResult {
  points: number;
  streak: number;
  lastActive: string;
}

// Awards `amount` points to the user's profile and rolls their daily streak.
// Streak rules:
//   - same day as last_active → streak unchanged
//   - last_active was yesterday → streak += 1
//   - last_active was earlier (or null) → streak resets to 1
// Read-modify-write; not atomic across concurrent calls, but matches the
// existing client-side mutation pattern in this codebase.
export async function awardPoints(userId: string, amount: number): Promise<AwardResult | null> {
  if (!userId || amount < 0) return null;

  const { data: profile, error: readErr } = await (supabase
    .from("profiles") as any)
    .select("points, streak, last_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (readErr) {
    console.error("awardPoints: failed to read profile", readErr);
    return null;
  }

  const today = todayStr();
  const yesterday = yesterdayStr();
  const lastActive: string | null = profile?.last_active ?? null;
  const currentStreak: number = profile?.streak ?? 0;
  const currentPoints: number = profile?.points ?? 0;

  let newStreak = currentStreak;
  if (lastActive !== today) {
    newStreak = lastActive === yesterday ? currentStreak + 1 : 1;
  }

  const newPoints = currentPoints + amount;

  const { error: writeErr } = await (supabase
    .from("profiles") as any)
    .update({
      points: newPoints,
      streak: newStreak,
      last_active: today,
    })
    .eq("user_id", userId);

  if (writeErr) {
    console.error("awardPoints: failed to update profile", writeErr);
    return null;
  }

  return { points: newPoints, streak: newStreak, lastActive: today };
}
