import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { LibraryItem } from "@/app/library/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collection = await prisma.libraryCollection.findUnique({
    where: { userId: session.userId },
  });

  const items: LibraryItem[] = collection
    ? (JSON.parse(collection.items) as LibraryItem[])
    : [];

  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items } = (await request.json()) as { items: LibraryItem[] };
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.libraryCollection.upsert({
    where: { userId: session.userId },
    update: { items: JSON.stringify(items) },
    create: { userId: session.userId, items: JSON.stringify(items) },
  });

  return NextResponse.json({ ok: true });
}
