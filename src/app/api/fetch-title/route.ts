import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ title: "" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SmartBookmark/1.0)",
      },
      signal: AbortSignal.timeout(5000),
    });

    const html = await response.text();

    // Extract <title> tag content
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ title: "" });
  }
}
