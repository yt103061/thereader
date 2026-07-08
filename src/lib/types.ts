export type BookStatus = "inbox" | "reading" | "done";

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  coverColor: string;
  addedAt: string; // ISO
  startedAt?: string;
  finishedAt?: string;
  /** true = ユーザーが積読インボックスに追加した実物の本(伴走モード) */
  userAdded?: boolean;
  /** ISBN検索(openBD)で確認できた場合のみ設定。表記ゆれのない正しい書誌情報の印 */
  isbn?: string;
  publisher?: string;
}

export interface Unit {
  id: string;
  bookId: string;
  order: number;
  chapter: number;
  chapterTitle: string;
  title: string;
  /** 段落の配列。1論点 = 1〜2分で読める分量 */
  paragraphs: string[];
  /** 読了時刻。未読なら undefined */
  readAt?: string;
  /** 論点0(授かり進捗ユニット)フラグ */
  isPrologue?: boolean;
}

export interface Card {
  id: string;
  unitId: string;
  bookId: string;
  unitTitle: string;
  bookTitle: string;
  text: string;
  createdAt: string;
  lastShownAt?: string;
  usedAt?: string;
}

export type AnchorHabit = "commute" | "lunch" | "night";

export interface Settings {
  anchorHabit: AnchorHabit;
  ifThenSentence: string;
  weeklyGoal: number; // 週あたりの目標回数
  onboarded: boolean;
}

export interface AppState {
  books: Book[];
  units: Unit[];
  cards: Card[];
  /** 読書セッションのあった日 (YYYY-MM-DD, 重複なし) */
  sessions: string[];
  settings: Settings;
}

export const ANCHOR_OPTIONS: {
  key: AnchorHabit;
  label: string;
  sentence: string;
}[] = [
  {
    key: "commute",
    label: "通勤・移動中",
    sentence: "電車に座ったら、ツヅキを開く",
  },
  {
    key: "lunch",
    label: "昼休みのあと",
    sentence: "昼ごはんを食べ終えたら、ツヅキを開く",
  },
  {
    key: "night",
    label: "寝る前",
    sentence: "ベッドに入ったら、ツヅキを開く",
  },
];
