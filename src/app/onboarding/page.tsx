"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { completeUnit, getNextUnit } from "@/lib/logic";
import { ANCHOR_OPTIONS, AnchorHabit } from "@/lib/types";

/**
 * オンボーディング = 「選ばれる」瞬間の設計。
 * サインアップなし・3ステップ・最後に必ず論点0を読了させ、
 * インストールから90秒で「読めた+カードが1枚できた」状態を作る(TTFV最短化)。
 */
export default function OnboardingPage() {
  const { state, update } = useStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [anchor, setAnchor] = useState<AnchorHabit>("commute");
  const [goal, setGoal] = useState(3);
  const [text, setText] = useState("");
  const [outputMode, setOutputMode] = useState(false);

  useEffect(() => {
    if (state.settings.onboarded) router.replace("/");
  }, [state.settings.onboarded, router]);

  const prologue = getNextUnit(state);
  const anchorOption = ANCHOR_OPTIONS.find((a) => a.key === anchor)!;

  function commitPlan() {
    update((s) => ({
      ...s,
      settings: {
        ...s.settings,
        anchorHabit: anchor,
        ifThenSentence: anchorOption.sentence,
        weeklyGoal: goal,
      },
    }));
    setStep(2);
  }

  function finishPrologue() {
    if (prologue) {
      update((s) => completeUnit(s, prologue.id, text));
    }
    setStep(3);
  }

  function enterApp() {
    update((s) => ({ ...s, settings: { ...s.settings, onboarded: true } }));
    router.replace("/");
  }

  /* Step 0: 共感 —「意志のせいではない」 */
  if (step === 0) {
    return (
      <main className="flex min-h-dvh flex-col justify-center px-7 pb-16">
        <p className="anim-fade-up text-xs font-bold tracking-widest text-ai">
          ツヅキ
        </p>
        <h1 className="anim-fade-up mt-4 text-[26px] font-black leading-snug">
          本が読めないのは、
          <br />
          意志のせいでは
          <br />
          ありません。
        </h1>
        <p className="anim-fade-up-1 mt-5 text-sm leading-relaxed text-ink-soft">
          原因は「最初の一歩」が重すぎる設計にあります。一冊の重さを見せられ、何を読むか選ばされ、スマホからの切り替えを求められる——読めなくて当然です。
        </p>
        <p className="anim-fade-up-2 mt-3 text-sm leading-relaxed text-ink-soft">
          ツヅキは、その全部を仕組みで消します。読むのは1回2分の「1論点」だけ。何を読むかは、アプリが決めておきます。
        </p>
        <button
          onClick={() => setStep(1)}
          className="anim-fade-up-3 mt-9 w-full rounded-2xl bg-ai py-4 text-base font-black text-white active:scale-[0.98]"
        >
          仕組みに任せてみる
        </button>
      </main>
    );
  }

  /* Step 1: 実行意図(if-then)の宣言 + 週リズム設定 */
  if (step === 1) {
    return (
      <main className="flex min-h-dvh flex-col justify-center px-7 pb-16">
        <h1 className="anim-fade-up text-xl font-black leading-snug">
          「いつ開くか」を、
          <br />
          いま決めてしまいましょう。
        </h1>
        <p className="anim-fade-up mt-3 text-xs leading-relaxed text-ink-soft">
          「時間があったら読む」は読まない人の合言葉。すでにある毎日の行動に、読書をくっつけます(if-thenプランニング)。
        </p>

        <div className="anim-fade-up-1 mt-6 space-y-2.5">
          {ANCHOR_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setAnchor(opt.key)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                anchor === opt.key
                  ? "border-ai bg-ai/10"
                  : "border-line bg-card"
              }`}
            >
              <p className="text-xs text-ink-soft">{opt.label}</p>
              <p className="mt-0.5 text-sm font-bold">「{opt.sentence}」</p>
            </button>
          ))}
        </div>

        <p className="anim-fade-up-2 mt-6 text-xs font-bold">
          週に何回なら、無理がない?
        </p>
        <div className="anim-fade-up-2 mt-2 flex gap-2">
          {[2, 3, 5].map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className={`flex-1 rounded-xl border py-3 text-sm font-bold ${
                goal === g ? "border-ai bg-ai text-white" : "border-line bg-card"
              }`}
            >
              週{g}回
            </button>
          ))}
        </div>
        <p className="anim-fade-up-2 mt-2 text-[11px] text-ink-soft">
          毎日は目標にしません。崩れない目標だけが、続く目標です。
        </p>

        <button
          onClick={commitPlan}
          className="anim-fade-up-3 mt-8 w-full rounded-2xl bg-ai py-4 text-base font-black text-white active:scale-[0.98]"
        >
          これで宣言する
        </button>
      </main>
    );
  }

  /* Step 2: その場で論点0を読む(授かり進捗 + 即TTFV) */
  if (step === 2 && prologue) {
    if (!outputMode) {
      return (
        <main className="flex min-h-dvh flex-col px-7 pb-32 pt-10">
          <p className="anim-fade-up text-xs font-bold text-ai">
            さっそく、最初の1論点。いまここで30秒だけ。
          </p>
          <h1 className="anim-fade-up mt-3 text-xl font-black leading-snug">
            {prologue.title}
          </h1>
          <div className="anim-fade-up-1 mt-5 space-y-4">
            {prologue.paragraphs.map((p, i) => (
              <p key={i} className="font-serif text-[15px] leading-8">
                {p}
              </p>
            ))}
          </div>
          <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-gradient-to-t from-paper via-paper to-transparent px-7 pb-6 pt-8">
            <button
              onClick={() => setOutputMode(true)}
              className="w-full rounded-2xl bg-ai py-4 text-base font-black text-white active:scale-[0.98]"
            >
              読んだ
            </button>
          </div>
        </main>
      );
    }
    return (
      <main className="flex min-h-dvh flex-col justify-center px-7 pb-16">
        <h1 className="anim-fade-up text-2xl font-black leading-snug">
          最後に、1行だけ。
        </h1>
        <p className="anim-fade-up mt-2 text-xs leading-relaxed text-ink-soft">
          読んだことを自分の言葉にすると、記憶への残り方が変わります(生成効果)。これがツヅキの「使える知識」の作り方です。
        </p>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例: 続かないのは自分のせいじゃなく、仕組みのせいだった"
          rows={3}
          className="anim-fade-up-1 mt-5 w-full rounded-2xl border border-line bg-card p-4 font-serif text-[15px] leading-relaxed outline-none focus:border-ai"
        />
        <button
          onClick={finishPrologue}
          disabled={!text.trim()}
          className="anim-fade-up-2 mt-4 w-full rounded-2xl bg-ai py-4 text-base font-black text-white disabled:opacity-40"
        >
          最初の知識カードを作る
        </button>
      </main>
    );
  }

  /* Step 3: 完了 — もう「今日読んだ人」 */
  return (
    <main className="relative flex min-h-dvh flex-col justify-center overflow-hidden px-7 pb-16 text-center">
      {["15%", "35%", "55%", "75%"].map((left, i) => (
        <span
          key={i}
          className="spark text-lg"
          style={{ left, top: "30%", animationDelay: `${i * 0.13}s` }}
        >
          ✦
        </span>
      ))}
      <p className="anim-pop text-4xl">🎉</p>
      <h1 className="anim-fade-up mt-3 text-xl font-black leading-snug">
        あなたはもう、
        <br />
        「今日読んだ人」です。
      </h1>
      <p className="anim-fade-up-1 mt-3 text-sm leading-relaxed text-ink-soft">
        1論点を読み、最初の知識カードができました。
        <br />
        インストールから、まだ2分も経っていません。
      </p>
      <div className="anim-pop mx-auto mt-6 max-w-xs rounded-2xl border border-ai/25 bg-card p-5 text-left shadow-lg">
        <p className="text-[10px] font-bold tracking-widest text-ai">
          知識カード No.1
        </p>
        <p className="mt-2 font-serif text-sm leading-relaxed">
          「{state.cards[0]?.text ?? text}」
        </p>
      </div>
      <p className="anim-fade-up-2 mt-6 text-xs text-ink-soft">
        次に「{anchorOption.sentence.replace("、ツヅキを開く", "")}」とき、
        <br />
        続きが待っています。
      </p>
      <button
        onClick={enterApp}
        className="anim-fade-up-3 mt-8 w-full rounded-2xl bg-ink py-4 text-base font-black text-paper active:scale-[0.98]"
      >
        ホームへ
      </button>
    </main>
  );
}
