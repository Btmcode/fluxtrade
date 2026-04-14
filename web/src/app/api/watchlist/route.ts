import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/lib/db";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const watchlists = await db.watchlist.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(watchlists);
  } catch (error) {
    console.error("Watchlist Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, symbols } = await request.json();
    const listName = name || "Default";

    // Find existing watchlist for this user+name combo
    const existing = await db.watchlist.findFirst({
      where: { userId, name: listName },
    });

    let watchlist;
    if (existing) {
      watchlist = await db.watchlist.update({
        where: { id: existing.id },
        data: { symbols: JSON.stringify(symbols) },
      });
    } else {
      watchlist = await db.watchlist.create({
        data: {
          userId,
          name: listName,
          symbols: JSON.stringify(symbols),
        },
      });
    }

    return NextResponse.json(watchlist);
  } catch (error) {
    console.error("Watchlist Save Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
