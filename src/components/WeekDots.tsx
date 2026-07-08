"use client";

import { useStore } from "@/lib/store";
import { getWeekProgress } from "@/lib/logic";

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

/**
 * 週リズム表示。
 * ストリーク(連続日数)は使わない: 1日の中断が全崩壊にならないよう、
 * 週単位のゆるい頻度目標だけを見せる(what-the-hell effect の防止)。
 */
export default function WeekDots() {
  const { state } = useStore();
  const { days, count, goal } = getWeekProgress(state);
  const reached = count >= goal;

  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-bold">今週のリズム</h2>
        <span className={`text-xs ${reached ? "font-bold text-mint" : "text-ink-soft"}`}>
          {reached ? `週${goal}回 達成 🎐` : `${count} / 週${goal}回でOK`}
        </span>
      </div>
      <div className="flex justify-between">
        {days.map((done, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className={`h-3.5 w-3.5 rounded-full ${
                done ? "bg-ai" : "border border-line bg-paper"
              }`}
            />
            <span className="text-[10px] text-ink-soft">{DAY_LABELS[i]}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
        毎日じゃなくていい。空いた日があっても、何も失われません。
      </p>
    </section>
  );
}
