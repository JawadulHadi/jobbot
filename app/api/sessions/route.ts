import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { chatSessions } from "@/lib/db/schema";
import { getOwnerId, ensureOwnerCookie } from "@/lib/owner";
import { eq, ilike, or, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const req = request as unknown as import("next/server").NextRequest;
  const db = getDb();
  if (!db) {
    return NextResponse.json({ sessions: [], configured: false }, { status: 200 });
  }

  const ownerId = getOwnerId(req);
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();

  const rows = await db
    .select()
    .from(chatSessions)
    .where(
      q
        ? and(eq(chatSessions.ownerId, ownerId), or(ilike(chatSessions.title, `%${q}%`), ilike(chatSessions.agentSessionId, `%${q}%`)))
        : eq(chatSessions.ownerId, ownerId)
    )
    .orderBy(desc(chatSessions.updatedAt))
    .limit(100);

  const res = NextResponse.json({ sessions: rows, configured: true });
  ensureOwnerCookie(res, req);
  return res;
}

export async function POST(request: Request) {
  const req = request as unknown as import("next/server").NextRequest;
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const ownerId = getOwnerId(req);
  let body: { title?: unknown; agentSessionId?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "New chat";
  const agentSessionId =
    typeof body.agentSessionId === "string" && body.agentSessionId.trim()
      ? body.agentSessionId.trim()
      : null;

  const [created] = await db
    .insert(chatSessions)
    .values({ ownerId, title, agentSessionId })
    .returning();

  const res = NextResponse.json({ session: created }, { status: 201 });
  ensureOwnerCookie(res, req);
  return res;
}