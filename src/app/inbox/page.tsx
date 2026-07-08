"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  addBook,
  getNextUnit,
  getQueue,
  getReadingBook,
  prioritizeBook,
  removeBook,
} from "@/lib/logic";
import BottomNav from "@/components/BottomNav";

/**
 * 積読インボックス。
 * 「気になる」は3秒のキャプチャで完結させてよい(欲の受け皿)。
 * 「今読む」への橋はアプリが架ける: 燃焼中は常に1冊、読了で自動昇格。
 */
export default function InboxPage() {
  const { state, update } = useStore();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  const reading = getReadingBook(state);
  const nextUnit = getNextUnit(state);
  const queue = getQueue(state);
  const done = state.books.filter((b) => b.status === "done");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    update((s) => addBook(s, title, author));
    setTitle("");
    setAuthor("");
  }

  return (
    <main className="px-5 pb-28 pt-6">
      <header className="anim-fade-up mb-1">
        <h1 className="text-xl font-black">積読インボックス</h1>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          気になったら、まずここへ。読む段取りはアプリの仕事です。
        </p>
      </header>

      {/* 3秒キャプチャ */}
      <form
        onSubmit={submit}
        className="anim-fade-up-1 mt-4 rounded-2xl border border-line bg-card p-4"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="気になった本のタイトル"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ai"
        />
        <div className="mt-2 flex gap-2">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="著者(任意)"
            className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ai"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="shrink-0 rounded-xl bg-ai px-5 text-sm font-bold text-white disabled:opacity-40"
          >
            入れる
          </button>
        </div>
        <p className="mt-2 text-[10px] text-ink-soft">
          手元の実物の本は「1回1見出し×12セッション」の伴走モードで読み切ります。
        </p>
      </form>

      {/* 燃焼中の1冊 */}
      {reading && (
        <section className="anim-fade-up-1 mt-5">
          <h2 className="mb-2 text-xs font-bold text-ink-soft">🔥 燃焼中(常に1冊だけ)</h2>
          <div className="flex items-center gap-3 rounded-2xl border border-shu/25 bg-card p-4">
            <div
              className="h-12 w-9 shrink-0 rounded-sm shadow"
              style={{ backgroundColor: reading.coverColor }}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{reading.title}</p>
              <p className="text-[11px] text-ink-soft">{reading.author}</p>
              {nextUnit && (
                <p className="mt-1 truncate text-[11px] text-ai">
                  次: {nextUnit.title}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* キュー */}
      <section className="anim-fade-up-2 mt-5">
        <h2 className="mb-2 text-xs font-bold text-ink-soft">
          待機中({queue.length}冊)
        </h2>
        {queue.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-4 text-center text-xs text-ink-soft">
            空です。「気になる」が湧いたら、3秒で放り込みましょう。
          </p>
        ) : (
          <ul className="space-y-2">
            {queue.map((b, i) => (
              <li
                key={b.id}
                className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5"
              >
                <div
                  className="h-10 w-8 shrink-0 rounded-sm shadow-sm"
                  style={{ backgroundColor: b.coverColor }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{b.title}</p>
                  <p className="text-[11px] text-ink-soft">{b.author}</p>
                </div>
                {i === 0 ? (
                  <span className="shrink-0 rounded-full bg-shu/10 px-2.5 py-1 text-[10px] font-bold text-shu">
                    次に燃える
                  </span>
                ) : (
                  <button
                    onClick={() => update((s) => prioritizeBook(s, b.id))}
                    className="shrink-0 rounded-lg border border-line px-2.5 py-1.5 text-[10px] font-bold text-ai"
                  >
                    次に読む
                  </button>
                )}
                {b.userAdded && (
                  <button
                    onClick={() => update((s) => removeBook(s, b.id))}
                    aria-label={`${b.title}を削除`}
                    className="shrink-0 px-1 text-ink-soft"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
          いま燃えている1冊を読み切ると、先頭の本に自動で火が移ります。あなたは選ばなくていい。
        </p>
      </section>

      {/* 読了 */}
      {done.length > 0 && (
        <section className="anim-fade-up-3 mt-5">
          <h2 className="mb-2 text-xs font-bold text-ink-soft">読み切った本</h2>
          <ul className="space-y-2">
            {done.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5 opacity-80"
              >
                <div
                  className="h-10 w-8 shrink-0 rounded-sm"
                  style={{ backgroundColor: b.coverColor }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{b.title}</p>
                  <p className="text-[11px] text-ink-soft">{b.author}</p>
                </div>
                <span className="text-mint">✓</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <BottomNav />
    </main>
  );
}
