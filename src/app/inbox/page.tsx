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
 *
 * 本の情報は2段構えで取り込む:
 *  1. かんたん追加 — タイトルだけ3秒で放り込む(デフォルト)
 *  2. ISBNで正確に登録 — 表記ゆれのない書誌情報を取得し、
 *     実際の目次を貼り付けて本物の章立てで読み進められるようにする
 */
export default function InboxPage() {
  const { state, update } = useStore();
  const reading = getReadingBook(state);
  const nextUnit = getNextUnit(state);
  const queue = getQueue(state);
  const done = state.books.filter((b) => b.status === "done");

  return (
    <main className="px-5 pb-28 pt-6">
      <header className="anim-fade-up mb-1">
        <h1 className="text-xl font-black">積読インボックス</h1>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          気になったら、まずここへ。読む段取りはアプリの仕事です。
        </p>
      </header>

      <div className="anim-fade-up-1 mt-4">
        <AddBookPanel onAdd={(input) => update((s) => addBook(s, input))} />
      </div>

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
              <p className="text-[11px] text-ink-soft">
                {reading.author}
                {reading.publisher && ` ・ ${reading.publisher}`}
              </p>
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
                  <p className="truncate text-[11px] text-ink-soft">
                    {b.author}
                    {b.publisher && ` ・ ${b.publisher}`}
                  </p>
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

/* ---------- 追加パネル ---------- */

interface AddBookInputArg {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  chapters?: string[];
}

type Mode = "quick" | "isbn";
type IsbnLookupStatus = "idle" | "loading" | "found" | "notfound" | "error";

function AddBookPanel({
  onAdd,
}: {
  onAdd: (input: AddBookInputArg) => void;
}) {
  const [mode, setMode] = useState<Mode>("quick");

  // かんたん追加
  const [quickTitle, setQuickTitle] = useState("");
  const [quickAuthor, setQuickAuthor] = useState("");

  // ISBN登録
  const [isbnInput, setIsbnInput] = useState("");
  const [lookupStatus, setLookupStatus] = useState<IsbnLookupStatus>("idle");
  const [found, setFound] = useState<{
    isbn: string;
    title: string;
    author: string;
    publisher: string;
  } | null>(null);
  const [chaptersText, setChaptersText] = useState("");

  function submitQuick(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onAdd({ title: quickTitle, author: quickAuthor });
    setQuickTitle("");
    setQuickAuthor("");
  }

  async function lookupIsbn(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = isbnInput.replace(/[^0-9Xx]/g, "");
    if (cleaned.length !== 10 && cleaned.length !== 13) {
      setLookupStatus("error");
      return;
    }
    setLookupStatus("loading");
    setFound(null);
    try {
      const res = await fetch(`/api/isbn?isbn=${cleaned}`);
      const data = await res.json();
      if (data.found) {
        setFound({
          isbn: data.isbn,
          title: data.title,
          author: data.author,
          publisher: data.publisher,
        });
        setLookupStatus("found");
      } else {
        setLookupStatus("notfound");
      }
    } catch {
      setLookupStatus("error");
    }
  }

  function submitFound(e: React.FormEvent) {
    e.preventDefault();
    if (!found) return;
    const chapters = chaptersText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    onAdd({
      title: found.title,
      author: found.author,
      isbn: found.isbn,
      publisher: found.publisher,
      chapters: chapters.length > 0 ? chapters : undefined,
    });
    setIsbnInput("");
    setFound(null);
    setChaptersText("");
    setLookupStatus("idle");
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-3 flex gap-1 rounded-xl bg-paper p-1">
        <button
          onClick={() => setMode("quick")}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
            mode === "quick" ? "bg-ai text-white" : "text-ink-soft"
          }`}
        >
          かんたん追加
        </button>
        <button
          onClick={() => setMode("isbn")}
          className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
            mode === "isbn" ? "bg-ai text-white" : "text-ink-soft"
          }`}
        >
          ISBNで正確に登録
        </button>
      </div>

      {mode === "quick" ? (
        <form onSubmit={submitQuick}>
          <input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="気になった本のタイトル"
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ai"
          />
          <div className="mt-2 flex gap-2">
            <input
              value={quickAuthor}
              onChange={(e) => setQuickAuthor(e.target.value)}
              placeholder="著者(任意)"
              className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ai"
            />
            <button
              type="submit"
              disabled={!quickTitle.trim()}
              className="shrink-0 rounded-xl bg-ai px-5 text-sm font-bold text-white disabled:opacity-40"
            >
              入れる
            </button>
          </div>
          <p className="mt-2 text-[10px] text-ink-soft">
            まずは3秒で放り込むだけでいい。実際に読み始めるときは「ISBNで正確に登録」から目次を持ち込むと、本物の章立てで読めます。
          </p>
        </form>
      ) : (
        <div>
          {!found ? (
            <form onSubmit={lookupIsbn}>
              <input
                value={isbnInput}
                onChange={(e) => {
                  setIsbnInput(e.target.value);
                  if (lookupStatus !== "idle") setLookupStatus("idle");
                }}
                placeholder="ISBN(本の裏表紙のバーコード下の数字)"
                inputMode="numeric"
                className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ai"
              />
              <button
                type="submit"
                disabled={lookupStatus === "loading" || !isbnInput.trim()}
                className="mt-2 w-full rounded-xl bg-ai py-2.5 text-sm font-bold text-white disabled:opacity-40"
              >
                {lookupStatus === "loading" ? "確認中…" : "書誌情報を確認する"}
              </button>
              {lookupStatus === "notfound" && (
                <p className="mt-2 text-[11px] text-shu">
                  見つかりませんでした。ISBNを確認するか、「かんたん追加」で手入力してください。
                </p>
              )}
              {lookupStatus === "error" && (
                <p className="mt-2 text-[11px] text-shu">
                  10桁または13桁のISBNを入力してください。通信状況が原因のこともあります。
                </p>
              )}
              <p className="mt-2 text-[10px] text-ink-soft">
                国立国会図書館の書誌データベース(openBD)で、タイトル・著者の表記ゆれを確認します。
              </p>
            </form>
          ) : (
            <form onSubmit={submitFound}>
              <div className="rounded-xl border border-ai/25 bg-ai/5 p-3">
                <p className="text-[10px] font-bold text-ai">この本が見つかりました</p>
                <p className="mt-1 text-sm font-bold">{found.title}</p>
                <p className="text-xs text-ink-soft">
                  {found.author}
                  {found.publisher && ` ・ ${found.publisher}`}
                </p>
              </div>

              <label className="mt-3 block text-[11px] font-bold text-ink-soft">
                目次を貼り付ける(任意・1行1見出し)
              </label>
              <textarea
                value={chaptersText}
                onChange={(e) => setChaptersText(e.target.value)}
                placeholder={"例:\n第1章 なぜ捨てられないのか\n第2章 90点ルール\n第3章 バッファの作り方"}
                rows={4}
                className="mt-1 w-full rounded-xl border border-line bg-paper p-3 text-xs leading-relaxed outline-none focus:border-ai"
              />
              <p className="mt-1 text-[10px] leading-relaxed text-ink-soft">
                目次を入れると、この本専用の章立てで「1見出しずつ読む」進行表が作られます。空欄なら汎用の12回構成になります。
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-ai py-2.5 text-sm font-bold text-white"
                >
                  この内容で追加する
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFound(null);
                    setLookupStatus("idle");
                  }}
                  className="rounded-xl border border-line px-4 text-xs text-ink-soft"
                >
                  やり直す
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
