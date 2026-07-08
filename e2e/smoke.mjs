// コアループのスモークテスト。
// 使い方: npm run build && npm run start & → npm run e2e
// (同梱 Chromium 以外を使う場合は CHROMIUM_PATH で実行ファイルを指定)
import { chromium } from "playwright";
import fs from "node:fs";

const SHOT_DIR = new URL("./shots/", import.meta.url).pathname;
fs.mkdirSync(SHOT_DIR, { recursive: true });

const results = [];
function check(name, cond) {
  results.push({ name, ok: !!cond });
  console.log(`${cond ? "✅" : "❌"} ${name}`);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: "ja-JP",
});
const page = await ctx.newPage();
const shot = async (n) => {
  await page.waitForTimeout(900); // 入場アニメーション完了待ち
  await page.screenshot({ path: `${SHOT_DIR}${n}.png` });
};

// ---- オンボーディング ----
await page.goto("http://localhost:3000/");
await page.waitForURL("**/onboarding");
check("未オンボード時に /onboarding へリダイレクト", true);
await page.waitForSelector("text=意志のせいでは");
await shot("01-onboarding-empathy");

await page.click("text=仕組みに任せてみる");
await page.waitForSelector("text=いつ開くか");
await page.click("text=寝る前");
await page.click("text=週3回");
await shot("02-onboarding-ifthen");
await page.click("text=これで宣言する");

await page.waitForSelector("text=この本があなたに効く理由");
check("論点0がその場で表示される", true);
await shot("03-onboarding-prologue");
await page.click("text=読んだ");
await page.waitForSelector("textarea");
await page.fill("textarea", "続かないのは仕組みのせい。明日は電車で1論点だけ読む");
await shot("04-onboarding-output");
await page.click("text=最初の知識カードを作る");
await page.waitForSelector("text=今日読んだ人");
check("オンボーディング完了演出(知識カード No.1)", await page.isVisible("text=知識カード No.1"));
await shot("05-onboarding-done");
await page.click("text=ホームへ");

// ---- ホーム ----
await page.waitForURL("http://localhost:3000/");
await page.waitForSelector("text=続きを読む");
check("ホームに巨大「続きを読む」", true);
check("if-then 文脈が表示される", await page.isVisible("text=ベッドに入ったら"));
check("次の論点が事前決定されている", await page.isVisible("text=意志力は消耗品である"));
check("週リズムに今日のドット反映", await page.isVisible("text=1 / 週3回でOK"));
check("今日はもう読めています表示", await page.isVisible("text=今日はもう読めています"));
await shot("06-home");

// ---- リーダー: コアループ ----
await page.click("text=続きを読む");
await page.waitForURL("**/read");
await page.waitForSelector("text=意志力は消耗品である");
check("章内の目標勾配表示", await page.isVisible("text=この章あと3論点"));
await shot("07-reader");
await page.click("button:has-text('読んだ')");
await page.waitForSelector("text=明日、どう使う?");
await page.fill("textarea", "夜に予定を入れず、朝一番に重い仕事をやる");
await shot("08-output");
await page.click("text=知識カードにする");
await page.waitForSelector("text=1論点、完了。");
check("完了演出が出る", true);
check("クリフハンガー(次論点予告)", await page.isVisible("text=環境が行動の9割"));
await shot("09-celebration");

// もう1論点(おまけ) → スキップ経路
await page.click("text=もう1論点だけ読む");
await page.waitForSelector("text=環境が行動の9割を決める");
await page.click("button:has-text('読んだ')");
await page.click("text=今日はスキップ");
await page.waitForSelector("text=1論点、完了。");
check("スキップでも完了演出", true);
await page.click("text=今日はここまで");
await page.waitForURL("http://localhost:3000/");

// ---- 積読インボックス ----
await page.click("text=積読");
await page.waitForURL("**/inbox");
check("燃焼中の1冊表示", await page.isVisible("text=燃焼中(常に1冊だけ)"));
await page.fill("input[placeholder='気になった本のタイトル']", "イシューからはじめよ");
await page.fill("input[placeholder='著者(任意)']", "安宅和人");
await page.click("text=入れる");
await page.waitForSelector("text=イシューからはじめよ");
check("3秒キャプチャで追加", true);
check("次に燃える表示", await page.isVisible("text=次に燃える"));
// 追加した本を先頭へ
await page.click("li:has-text('イシューからはじめよ') >> text=次に読む");
const firstQueueItem = await page.locator("li").filter({ hasText: "次に燃える" }).first().textContent();
check("「次に読む」でキュー先頭へ", firstQueueItem.includes("イシューからはじめよ"));
await shot("10-inbox");

// ---- ISBNで正確に登録(openBD経由のサーバーサイド書誌検索) ----
await page.click("text=ISBNで正確に登録");
await page.fill("input[placeholder*='ISBN']", "9784478025819");
await shot("10b-isbn-form");
await page.click("text=書誌情報を確認する");
await page.waitForSelector("text=この本が見つかりました", { timeout: 10000 });
check("ISBN検索で書誌情報を取得", await page.isVisible("text=嫌われる勇気"));
await page.fill(
  "textarea[placeholder*='第1章']",
  "第1章 トラウマを否定せよ\n第2章 すべての悩みは対人関係\n第3章 他者の課題を切り捨てる"
);
await shot("10c-isbn-found");
await page.click("text=この内容で追加する");
await page.waitForSelector("text=嫌われる勇気");
check("目次つきでISBN登録した本がキューに入る", await page.isVisible("li:has-text('嫌われる勇気')"));

// ---- 知識資産 ----
await page.click("text=知識資産");
await page.waitForURL("**/cards");
check("月間サマリー(2枚)", await page.isVisible("text=今月、2個の論点を"));
check("カード本文表示", await page.isVisible("text=朝一番に重い仕事"));
await shot("11-cards");

// ---- 設定 ----
await page.click("text=設定");
await page.waitForURL("**/settings");
await shot("12-settings");

// ---- 永続化(リロード) ----
await page.goto("http://localhost:3000/");
await page.waitForSelector("text=続きを読む");
check("リロード後もオンボード済みでホーム表示", page.url() === "http://localhost:3000/");
check("リロード後も週リズム保持", await page.isVisible("text=1 / 週3回でOK"));
check("リロード後も次論点が進んでいる", await page.isVisible("text=やる気は行動の後にやってくる"));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
