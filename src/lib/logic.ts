import { AppState, Book, Card, Unit } from "./types";
import { buildCompanionUnits } from "./seed";

/* ---------- 日付ユーティリティ ---------- */

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) /
      86400000
  );
}

/** 今週(月曜始まり)の日付キー7つ */
export function currentWeekKeys(): string[] {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 月曜=0
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return dateKey(d);
  });
}

/* ---------- セレクタ ---------- */

export function getReadingBook(state: AppState): Book | undefined {
  return state.books.find((b) => b.status === "reading");
}

export function getBookUnits(state: AppState, bookId: string): Unit[] {
  return state.units
    .filter((u) => u.bookId === bookId)
    .sort((a, b) => a.order - b.order);
}

/** 次に読む1論点をアプリが事前決定する(選択コストゼロの核) */
export function getNextUnit(state: AppState): Unit | undefined {
  const book = getReadingBook(state);
  if (!book) return undefined;
  return getBookUnits(state, book.id).find((u) => !u.readAt);
}

/**
 * 目標勾配: 総重量は見せず「この章あと◯論点」だけ返す。
 */
export function getChapterProgress(
  state: AppState,
  unit: Unit
): { chapterTitle: string; remaining: number; total: number; done: number } {
  const chapterUnits = state.units.filter(
    (u) => u.bookId === unit.bookId && u.chapter === unit.chapter
  );
  const done = chapterUnits.filter((u) => u.readAt).length;
  return {
    chapterTitle: unit.chapterTitle,
    remaining: chapterUnits.length - done,
    total: chapterUnits.length,
    done,
  };
}

/** 今週の読書日数と目標 */
export function getWeekProgress(state: AppState): {
  days: boolean[];
  count: number;
  goal: number;
} {
  const week = currentWeekKeys();
  const days = week.map((k) => state.sessions.includes(k));
  return {
    days,
    count: days.filter(Boolean).length,
    goal: state.settings.weeklyGoal,
  };
}

export function getLastSessionKey(state: AppState): string | undefined {
  return [...state.sessions].sort().pop();
}

/** 罪悪感なきリカバリー: 7日以上空いたら「おかえり」 */
export function isComeback(state: AppState): boolean {
  const last = getLastSessionKey(state);
  if (!last) return false;
  return daysBetween(last, todayKey()) >= 7;
}

/** フレッシュスタート効果: 月曜または月初で、まだ今日読んでいない */
export function isFreshStart(state: AppState): boolean {
  const now = new Date();
  const landmark = now.getDay() === 1 || now.getDate() === 1;
  return (
    landmark &&
    state.sessions.length > 0 &&
    !state.sessions.includes(todayKey()) &&
    !isComeback(state) // おかえりバナーを優先
  );
}

/**
 * 間隔をあけた想起: 再提示すべき知識カードを1枚だけ選ぶ。
 * - 作成から2日以上経過
 * - 前回提示から3日以上経過(未提示なら対象)
 * - 「使った」記録がまだないもの
 */
export function pickReviewCard(state: AppState): Card | undefined {
  const today = todayKey();
  const candidates = state.cards.filter((c) => {
    if (c.usedAt) return false;
    if (daysBetween(c.createdAt.slice(0, 10), today) < 2) return false;
    if (c.lastShownAt && daysBetween(c.lastShownAt.slice(0, 10), today) < 3)
      return false;
    return true;
  });
  candidates.sort((a, b) =>
    (a.lastShownAt ?? a.createdAt).localeCompare(b.lastShownAt ?? b.createdAt)
  );
  return candidates[0];
}

/** 積読キュー(配列順 = 昇格順) */
export function getQueue(state: AppState): Book[] {
  return state.books.filter((b) => b.status === "inbox");
}

/* ---------- 状態遷移 ---------- */

function promoteNext(state: AppState): AppState {
  if (state.books.some((b) => b.status === "reading")) return state;
  const next = state.books.find((b) => b.status === "inbox");
  if (!next) return state;
  return {
    ...state,
    books: state.books.map((b) =>
      b.id === next.id
        ? { ...b, status: "reading" as const, startedAt: new Date().toISOString() }
        : b
    ),
  };
}

/**
 * 論点読了。セッション記録・カード生成・読了判定・次の本の自動昇格までを一括で行う。
 */
export function completeUnit(
  state: AppState,
  unitId: string,
  cardText: string
): AppState {
  const unit = state.units.find((u) => u.id === unitId);
  if (!unit || unit.readAt) return state;
  const now = new Date().toISOString();
  const book = state.books.find((b) => b.id === unit.bookId);

  let next: AppState = {
    ...state,
    units: state.units.map((u) => (u.id === unitId ? { ...u, readAt: now } : u)),
    sessions: state.sessions.includes(todayKey())
      ? state.sessions
      : [...state.sessions, todayKey()],
  };

  const text = cardText.trim();
  if (text && book) {
    next = {
      ...next,
      cards: [
        {
          id: `card-${Date.now()}`,
          unitId,
          bookId: unit.bookId,
          unitTitle: unit.title,
          bookTitle: book.title,
          text,
          createdAt: now,
        },
        ...next.cards,
      ],
    };
  }

  // 本を読み切ったら done にして、キューの先頭を自動昇格
  const allRead = next.units
    .filter((u) => u.bookId === unit.bookId)
    .every((u) => u.readAt);
  if (allRead) {
    next = {
      ...next,
      books: next.books.map((b) =>
        b.id === unit.bookId
          ? { ...b, status: "done" as const, finishedAt: now }
          : b
      ),
    };
    next = promoteNext(next);
  }
  return next;
}

export interface AddBookInput {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  /** ユーザーが貼り付けた目次(1見出し1行)。あれば実際の章立てでセッションを組む */
  chapters?: string[];
}

/**
 * 積読インボックスへの追加。
 * タイトル+著者だけの3秒キャプチャにも、ISBN確認済み・目次入力ありの
 * 「本格登録」にも対応する。実物の本には伴走セッションを自動生成する。
 */
export function addBook(state: AppState, input: AddBookInput): AppState {
  const id = `book-${Date.now()}`;
  const colors = ["#8b3a3a", "#4a5d23", "#5b4a8b", "#8b6f3a", "#3a6b8b"];
  const book: Book = {
    id,
    title: input.title.trim(),
    author: input.author.trim() || "著者未設定",
    status: "inbox",
    coverColor: colors[state.books.length % colors.length],
    addedAt: new Date().toISOString(),
    userAdded: true,
    isbn: input.isbn,
    publisher: input.publisher,
  };
  const withBook: AppState = {
    ...state,
    books: [...state.books, book],
    units: [...state.units, ...buildCompanionUnits(id, input.chapters)],
  };
  return promoteNext(withBook);
}

/** 「次に燃やす」: キューの先頭へ移動 */
export function prioritizeBook(state: AppState, bookId: string): AppState {
  const target = state.books.find((b) => b.id === bookId);
  if (!target || target.status !== "inbox") return state;
  const others = state.books.filter((b) => b.id !== bookId);
  const firstInboxIdx = others.findIndex((b) => b.status === "inbox");
  const idx = firstInboxIdx === -1 ? others.length : firstInboxIdx;
  return {
    ...state,
    books: [...others.slice(0, idx), target, ...others.slice(idx)],
  };
}

export function removeBook(state: AppState, bookId: string): AppState {
  const book = state.books.find((b) => b.id === bookId);
  if (!book || book.status !== "inbox") return state;
  return {
    ...state,
    books: state.books.filter((b) => b.id !== bookId),
    units: state.units.filter((u) => u.bookId !== bookId),
  };
}

/** 復習カードへの回答 */
export function answerReview(
  state: AppState,
  cardId: string,
  used: boolean
): AppState {
  const now = new Date().toISOString();
  return {
    ...state,
    cards: state.cards.map((c) =>
      c.id === cardId
        ? { ...c, lastShownAt: now, usedAt: used ? now : c.usedAt }
        : c
    ),
  };
}
