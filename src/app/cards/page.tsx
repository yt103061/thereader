"use client";

import { useStore } from "@/lib/store";
import BottomNav from "@/components/BottomNav";

/**
 * 知識資産。
 * カードの蓄積を「資産」として可視化し、行動事実ベースの称賛で
 * 「読める人」という自己認識を強化する(アイデンティティベースの習慣)。
 */
export default function CardsPage() {
  const { state } = useStore();
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthCount = state.cards.filter((c) =>
    c.createdAt.startsWith(monthPrefix)
  ).length;
  const usedCount = state.cards.filter((c) => c.usedAt).length;

  const byBook = new Map<string, typeof state.cards>();
  for (const c of state.cards) {
    const list = byBook.get(c.bookTitle) ?? [];
    list.push(c);
    byBook.set(c.bookTitle, list);
  }

  return (
    <main className="px-5 pb-28 pt-6">
      <header className="anim-fade-up mb-4">
        <h1 className="text-xl font-black">知識資産</h1>
      </header>

      <section className="anim-fade-up-1 rounded-2xl bg-ink p-5 text-paper">
        <p className="text-[11px] opacity-70">{now.getMonth() + 1}月のあなた</p>
        <p className="mt-1.5 text-sm font-bold leading-relaxed">
          今月、{monthCount}個の論点を
          <br />
          自分の言葉にしました。
        </p>
        <div className="mt-4 flex gap-6 text-[11px] opacity-80">
          <span>累計カード {state.cards.length}枚</span>
          <span>実際に使った {usedCount}枚</span>
        </div>
      </section>

      {state.cards.length === 0 ? (
        <p className="anim-fade-up-2 mt-6 rounded-2xl border border-dashed border-line p-6 text-center text-xs leading-relaxed text-ink-soft">
          まだカードがありません。
          <br />
          1論点読んで1行書くと、ここに貯まっていきます。
        </p>
      ) : (
        <div className="anim-fade-up-2 mt-6 space-y-6">
          {[...byBook.entries()].map(([bookTitle, cards]) => (
            <section key={bookTitle}>
              <h2 className="mb-2 text-xs font-bold text-ink-soft">
                {bookTitle}({cards.length}枚)
              </h2>
              <ul className="space-y-2">
                {cards.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-2xl border border-line bg-card p-4"
                  >
                    <p className="font-serif text-sm leading-relaxed">
                      「{c.text}」
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-ink-soft">
                      <span className="truncate">{c.unitTitle}</span>
                      <span className="ml-2 shrink-0">
                        {c.usedAt ? (
                          <span className="font-bold text-mint">使った ✓</span>
                        ) : (
                          c.createdAt.slice(5, 10).replace("-", "/")
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
