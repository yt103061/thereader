import { NextRequest, NextResponse } from "next/server";

/**
 * ISBNから書誌情報を引く。
 * openBD(https://openbd.jp/)はCORS非対応のため、サーバー側で中継する。
 * ユーザーが実物の本を正確なタイトル・著者表記で登録できるようにする経路。
 */

interface OpenBdSummary {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  pubdate: string;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("isbn") ?? "";
  const isbn = raw.replace(/[^0-9Xx]/g, "");
  if (isbn.length !== 10 && isbn.length !== 13) {
    return NextResponse.json(
      { found: false, reason: "invalid_isbn" },
      { status: 400 }
    );
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.openbd.jp/v1/get?isbn=${encodeURIComponent(isbn)}`,
      { signal: AbortSignal.timeout(8000) }
    );
  } catch {
    return NextResponse.json(
      { found: false, reason: "network_error" },
      { status: 502 }
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { found: false, reason: "upstream_error" },
      { status: 502 }
    );
  }

  const data = (await res.json()) as [{ summary?: OpenBdSummary } | null];
  const summary = data?.[0]?.summary;

  if (!summary || !summary.title) {
    return NextResponse.json({ found: false, reason: "not_found" });
  }

  // openBD の著者表記は "姓,名,生年-" が空白区切りで並ぶ (例: "岸見,一郎,1956- 古賀,史健,1973-")
  const author = summary.author
    .split(/\s+/)
    .map((part) =>
      part
        .split(",")
        .filter((s) => s && !/^\d{4}-?$/.test(s))
        .join(" ")
        .trim()
    )
    .filter(Boolean)
    .join("、");

  return NextResponse.json({
    found: true,
    isbn,
    title: summary.title,
    author: author || summary.author,
    publisher: summary.publisher,
  });
}
