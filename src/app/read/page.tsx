"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  completeUnit,
  getBookUnits,
  getChapterProgress,
  getNextUnit,
  getQueue,
} from "@/lib/logic";
import { pickPraise } from "@/lib/praise";
import { Book, Unit } from "@/lib/types";

type Phase = "reading" | "output" | "celebration";

interface Outcome {
  praise: string;
  cardText: string;
  nextUnit?: Unit;
  finishedBookTitle?: string;
  promotedBook?: Book;
}

export default function ReadPage() {
  const { state, update } = useStore();
  const router = useRouter();

  const [unit, setUnit] = useState<Unit | undefined>(() => getNextUnit(state));
  const [phase, setPhase] = useState<Phase>("reading");
  const [text, setText] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  useEffect(() => {
    if (!unit) router.replace("/");
  }, [unit, router]);

  if (!unit) return null;

  const book = state.books.find((b) => b.id === unit.bookId);
  const progress = getChapterProgress(state, unit);

  function finish(cardText: string) {
    if (!unit || !book) return;
    const rest = getBookUnits(state, unit.bookId).filter(
      (u) => !u.readAt && u.id !== unit.id
    );
    const willFinish = rest.length === 0;
    setOutcome({
      praise: pickPraise(),
      cardText: cardText.trim(),
      nextUnit: rest[0],
      finishedBookTitle: willFinish ? book.title : undefined,
      promotedBook: willFinish ? getQueue(state)[0] : undefined,
    });
    update((s) => completeUnit(s, unit.id, cardText));
    setPhase("celebration");
  }

  function readNext() {
    if (!outcome?.nextUnit) return;
    setUnit(outcome.nextUnit);
    setText("");
    setOutcome(null);
    setPhase("reading");
    window.scrollTo(0, 0);
  }

  /* ---------- 読む ---------- */
  if (phase === "reading") {
    return (
      <main className="flex min-h-dvh flex-col px-6 pb-32 pt-5">
        <header className="anim-fade-up mb-6 flex items-center justify-between text-[11px] text-ink-soft">
          <button onClick={() => router.push("/")} className="py-1 pr-3">
            ← 閉じる
          </button>
          {/* 目標勾配: 総重量は見せず、章内の残りだけ */}
          <span>
            {progress.chapterTitle} ・ この章あと{progress.remaining}論点
          </span>
        </header>

        <article className="anim-fade-up-1">
          <p className="text-[11px] text-ink-soft">{book?.title}</p>
          <h1 className="mt-1.5 text-xl font-black leading-snug">{unit.title}</h1>
          <div className="mt-5 space-y-4">
            {unit.paragraphs.map((p, i) => (
              <p key={i} className="font-serif text-[15px] leading-8">
                {p}
              </p>
            ))}
          </div>
        </article>

        <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-gradient-to-t from-paper via-paper to-transparent px-6 pb-6 pt-8">
          <button
            onClick={() => setPhase("output")}
            className="w-full rounded-2xl bg-ai py-4 text-base font-black text-white shadow-lg active:scale-[0.98]"
          >
            読んだ
          </button>
        </div>
      </main>
    );
  }

  /* ---------- 30秒アウトプット(生成効果) ---------- */
  if (phase === "output") {
    return (
      <main className="flex min-h-dvh flex-col justify-center px-6 pb-10 pt-5">
        <div className="anim-fade-up">
          <p className="text-[11px] text-ink-soft">
            {book?.title} ─ {unit.title}
          </p>
          <h1 className="mt-2 text-2xl font-black leading-snug">
            明日、どう使う?
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            自分の言葉で1行だけ。きれいな要約より、稚拙な自分ごとが記憶に残ります。
          </p>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例: 明日の朝会で、結論から話してみる"
            rows={3}
            className="mt-5 w-full rounded-2xl border border-line bg-card p-4 font-serif text-[15px] leading-relaxed outline-none focus:border-ai"
          />
          <button
            onClick={() => finish(text)}
            disabled={!text.trim()}
            className="mt-4 w-full rounded-2xl bg-ai py-4 text-base font-black text-white disabled:opacity-40"
          >
            知識カードにする
          </button>
          <button
            onClick={() => finish("")}
            className="mt-2 w-full py-3 text-xs text-ink-soft"
          >
            今日はスキップ(読んだだけで十分えらい)
          </button>
        </div>
      </main>
    );
  }

  /* ---------- 完了演出(ピーク・エンド + クリフハンガー) ---------- */
  return (
    <main className="relative flex min-h-dvh flex-col justify-center overflow-hidden px-6 pb-10 pt-5">
      {/* きらめき */}
      {["12%", "28%", "50%", "72%", "88%"].map((left, i) => (
        <span
          key={i}
          className="spark text-lg"
          style={{ left, top: "38%", animationDelay: `${i * 0.12}s` }}
        >
          ✦
        </span>
      ))}

      <div className="text-center">
        <p className="anim-fade-up text-4xl">🎉</p>
        <h1 className="anim-fade-up mt-2 text-xl font-black">1論点、完了。</h1>
        <p className="anim-fade-up-1 mt-2 text-sm text-ink-soft">
          {outcome?.praise}
        </p>

        {outcome?.cardText && (
          <div className="anim-pop mx-auto mt-6 max-w-xs rounded-2xl border border-ai/25 bg-card p-5 text-left shadow-lg">
            <p className="text-[10px] font-bold tracking-widest text-ai">
              知識カード No.{state.cards.length}
            </p>
            <p className="mt-2 font-serif text-sm leading-relaxed">
              「{outcome.cardText}」
            </p>
          </div>
        )}

        {outcome?.finishedBookTitle ? (
          <div className="anim-fade-up-2 mt-7">
            <p className="text-sm font-black text-shu">
              『{outcome.finishedBookTitle}』を読み切りました。
            </p>
            {outcome.promotedBook ? (
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                次は『{outcome.promotedBook.title}』に火をつけておきました。
                <br />
                明日開いたら、また続きからです。
              </p>
            ) : (
              <p className="mt-2 text-xs text-ink-soft">
                積読インボックスに次の1冊を入れておきましょう。
              </p>
            )}
          </div>
        ) : (
          outcome?.nextUnit && (
            /* ツァイガルニク効果: 未完了の予告を残して閉じさせる */
            <div className="anim-fade-up-2 mx-auto mt-7 max-w-xs rounded-xl border border-dashed border-line bg-paper px-4 py-3">
              <p className="text-[10px] text-ink-soft">次の論点(続きはまた今度)</p>
              <p className="mt-1 text-sm font-bold">
                {outcome.nextUnit.title} →
              </p>
            </div>
          )
        )}

        <button
          onClick={() => router.push("/")}
          className="anim-fade-up-3 mt-8 w-full rounded-2xl bg-ink py-4 text-base font-black text-paper active:scale-[0.98]"
        >
          今日はここまで
        </button>
        {outcome?.nextUnit && (
          <button
            onClick={readNext}
            className="anim-fade-up-3 mt-2 w-full py-3 text-xs text-ink-soft"
          >
            もう1論点だけ読む(おまけ)
          </button>
        )}
      </div>
    </main>
  );
}
