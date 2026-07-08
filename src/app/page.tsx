"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  answerReview,
  getNextUnit,
  getQueue,
  getReadingBook,
  isComeback,
  isFreshStart,
  pickReviewCard,
  todayKey,
} from "@/lib/logic";
import BottomNav from "@/components/BottomNav";
import WeekDots from "@/components/WeekDots";

export default function HomePage() {
  const { state, update } = useStore();
  const router = useRouter();
  const onboarded = state.settings.onboarded;

  useEffect(() => {
    if (!onboarded) router.replace("/onboarding");
  }, [onboarded, router]);

  if (!onboarded) return null;

  const book = getReadingBook(state);
  const unit = getNextUnit(state);
  const queue = getQueue(state);
  const comeback = isComeback(state);
  const freshStart = isFreshStart(state);
  const reviewCard = pickReviewCard(state);
  const readToday = state.sessions.includes(todayKey());

  return (
    <main className="px-5 pb-28 pt-6">
      {/* ヘッダー */}
      <header className="anim-fade-up mb-5 flex items-baseline justify-between">
        <h1 className="text-xl font-black tracking-wide">
          ツヅキ
          <span className="ml-1.5 align-middle text-[10px] font-normal text-ink-soft">
            開いた瞬間、続きから。
          </span>
        </h1>
      </header>

      {/* if-then 文脈(実行意図の常時想起) */}
      <p className="anim-fade-up mb-4 flex items-center gap-1.5 text-xs text-ink-soft">
        <span className="text-shu">⚡</span>
        あなたの合図:「{state.settings.ifThenSentence}」
      </p>

      {/* おかえり / フレッシュスタート バナー */}
      {comeback && (
        <div className="anim-fade-up mb-4 rounded-2xl border border-mint/30 bg-mint/10 p-4">
          <p className="text-sm font-bold text-mint">おかえりなさい。</p>
          <p className="mt-1 text-xs leading-relaxed text-ink">
            脳は続きを忘れていません。空いた日々のことは、今日の1論点の前では何の意味も持ちません。続きはすぐ下にあります。
          </p>
        </div>
      )}
      {freshStart && (
        <div className="anim-fade-up mb-4 rounded-2xl border border-ai/20 bg-ai/10 p-4">
          <p className="text-sm font-bold text-ai">新しい週が始まりました。</p>
          <p className="mt-1 text-xs leading-relaxed text-ink">
            先週のことは、もう関係ありません。今週の1回目をここから。
          </p>
        </div>
      )}

      {/* 続きを読む(選択ゼロの巨大ボタン) */}
      {book && unit ? (
        <section className="anim-fade-up-1 mb-5">
          <div className="overflow-hidden rounded-3xl border border-line bg-card">
            <div className="flex items-center gap-3 border-b border-line px-5 py-3">
              <div
                className="h-9 w-7 shrink-0 rounded-sm shadow-sm"
                style={{ backgroundColor: book.coverColor }}
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{book.title}</p>
                <p className="text-[10px] text-ink-soft">
                  {book.author} ・ 燃焼中の1冊
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 pt-4">
              <p className="text-[11px] text-ink-soft">
                次の論点(アプリが決めておきました)
              </p>
              <p className="mt-1 text-base font-bold leading-snug">{unit.title}</p>
              <Link
                href="/read"
                className="anim-glow mt-4 block rounded-2xl bg-ai px-6 py-5 text-center text-white active:scale-[0.98]"
              >
                <span className="block text-lg font-black tracking-wide">
                  続きを読む
                </span>
                <span className="mt-0.5 block text-[11px] opacity-80">
                  約2分 ・ 読むものは決まっています
                </span>
              </Link>
              {readToday && (
                <p className="mt-3 text-center text-[11px] text-mint">
                  今日はもう読めています。ここから先は全部おまけです。
                </p>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="anim-fade-up-1 mb-5 rounded-3xl border border-line bg-card p-6 text-center">
          {queue.length > 0 ? (
            <p className="text-sm leading-relaxed">次の本を準備しています…</p>
          ) : (
            <>
              <p className="text-sm font-bold">積読が空です。</p>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                気になっている本を1冊、インボックスに入れましょう。読む段取りはアプリがやります。
              </p>
              <Link
                href="/inbox"
                className="mt-4 inline-block rounded-xl bg-ai px-5 py-3 text-sm font-bold text-white"
              >
                積読インボックスへ
              </Link>
            </>
          )}
        </section>
      )}

      {/* 週リズム */}
      <div className="anim-fade-up-2 mb-5">
        <WeekDots />
      </div>

      {/* 知識カードの再提示(間隔をあけた想起) */}
      {reviewCard && (
        <section className="anim-fade-up-3 rounded-2xl border border-line bg-card p-4">
          <h2 className="text-xs font-bold text-ink-soft">
            すこし前のあなたが、こう書いていました
          </h2>
          <p className="mt-2 font-serif text-sm leading-relaxed">
            「{reviewCard.text}」
          </p>
          <p className="mt-1 text-[10px] text-ink-soft">
            {reviewCard.bookTitle} ─ {reviewCard.unitTitle}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-bold">これ、使ってみた?</span>
            <button
              onClick={() => update((s) => answerReview(s, reviewCard.id, true))}
              className="rounded-lg bg-mint px-3 py-1.5 text-xs font-bold text-white"
            >
              使った!
            </button>
            <button
              onClick={() => update((s) => answerReview(s, reviewCard.id, false))}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-soft"
            >
              まだ
            </button>
          </div>
        </section>
      )}

      <BottomNav />
    </main>
  );
}
