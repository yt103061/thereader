"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ANCHOR_OPTIONS } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

export default function SettingsPage() {
  const { state, update, reset } = useStore();
  const [confirming, setConfirming] = useState(false);

  return (
    <main className="px-5 pb-28 pt-6">
      <header className="anim-fade-up mb-5">
        <h1 className="text-xl font-black">設定</h1>
      </header>

      <section className="anim-fade-up-1">
        <h2 className="mb-2 text-xs font-bold text-ink-soft">
          あなたの合図(if-then)
        </h2>
        <div className="space-y-2">
          {ANCHOR_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() =>
                update((s) => ({
                  ...s,
                  settings: {
                    ...s.settings,
                    anchorHabit: opt.key,
                    ifThenSentence: opt.sentence,
                  },
                }))
              }
              className={`w-full rounded-2xl border p-3.5 text-left ${
                state.settings.anchorHabit === opt.key
                  ? "border-ai bg-ai/10"
                  : "border-line bg-card"
              }`}
            >
              <p className="text-[11px] text-ink-soft">{opt.label}</p>
              <p className="text-sm font-bold">「{opt.sentence}」</p>
            </button>
          ))}
        </div>
      </section>

      <section className="anim-fade-up-2 mt-6">
        <h2 className="mb-2 text-xs font-bold text-ink-soft">週の目標回数</h2>
        <div className="flex gap-2">
          {[2, 3, 5].map((g) => (
            <button
              key={g}
              onClick={() =>
                update((s) => ({
                  ...s,
                  settings: { ...s.settings, weeklyGoal: g },
                }))
              }
              className={`flex-1 rounded-xl border py-3 text-sm font-bold ${
                state.settings.weeklyGoal === g
                  ? "border-ai bg-ai text-white"
                  : "border-line bg-card"
              }`}
            >
              週{g}回
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-soft">
          迷ったら少なく。達成できる目標だけが、次の週につながります。
        </p>
      </section>

      <section className="anim-fade-up-3 mt-8">
        <h2 className="mb-2 text-xs font-bold text-ink-soft">データ</h2>
        {confirming ? (
          <div className="rounded-2xl border border-shu/30 bg-card p-4">
            <p className="text-xs leading-relaxed">
              すべての読書記録・知識カード・積読が消えます。よろしいですか?
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  reset();
                  setConfirming(false);
                }}
                className="rounded-xl bg-shu px-4 py-2.5 text-xs font-bold text-white"
              >
                初期化する
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-xl border border-line px-4 py-2.5 text-xs"
              >
                やめる
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="w-full rounded-2xl border border-line bg-card py-3.5 text-xs font-bold text-shu"
          >
            データを初期化する
          </button>
        )}
      </section>

      <p className="mt-8 text-center text-[10px] text-ink-soft">
        ツヅキ v0.1 — 開いた瞬間、続きから。
      </p>

      <BottomNav />
    </main>
  );
}
