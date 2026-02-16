import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface BookmarkInput {
  id: string;
  title: string;
  url: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { query, bookmarks } = (await req.json()) as {
      query: string;
      bookmarks: BookmarkInput[];
    };

    if (!query?.trim() || !bookmarks?.length) {
      return NextResponse.json({ matchedIds: [] });
    }

    const bookmarkList = bookmarks
      .map(
        (b, i) => `${i + 1}. [${b.id}] "${b.title}" — ${b.url}`
      )
      .join("\n");

    const prompt = `
You are a bookmark search assistant.

Bookmarks:
${bookmarkList}

User query:
"${query}"

Return ONLY a JSON array of bookmark IDs that match.
If nothing matches, return [].
`;

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    });

    const text =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

    let matchedIds: string[] = [];
    try {
      matchedIds = JSON.parse(text.trim());
      if (!Array.isArray(matchedIds)) matchedIds = [];
    } catch {
      matchedIds = [];
    }

    return NextResponse.json({ matchedIds });
  } catch (err) {
    console.error("Gemini error:", err);
    return NextResponse.json(
      { error: "AI search failed" },
      { status: 500 }
    );
  }
}
