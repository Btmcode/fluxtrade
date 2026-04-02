import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/lib/db";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const watchlists = await db.watchlist.findMany({
      where: { userId: session.user.id },
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

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, symbols } = await request.json();

    const watchlist = await db.watchlist.upsert({
      where: {
        userId_name: {
          userId: session.user.id,
          name: name || "Default",
        },
      },
      update: {
        symbols: JSON.stringify(symbols),
      },
      create: {
        userId: session.user.id,
        name: name || "Default",
        symbols: JSON.stringify(symbols),
      },
    });

    return NextResponse.json(watchlist);
  } catch (error) {
    console.error("Watchlist Save Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
