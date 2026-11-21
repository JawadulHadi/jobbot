import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { chatSessions } from "@/lib/db/schema";
import { getOwnerId, ensureOwnerCookie } from "@/lib/owner";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const req = request as unknown as import("next/server").NextRequest;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const { id } = await params;
  const ownerId = getOwnerId(req);
  const row = await db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.id, id), eq(chatSessions.ownerId, ownerId)))
    .limit(1)
    .then((r) => r[0]);

  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const res = NextResponse.json({ session: row });
  ensureOwnerCookie(res, req);
  return res;
}

export async function PATCH(request: Request, { params }: Params) {
  const req = request as unknown as import("next/server").NextRequest;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const { id } = await params;
  const ownerId = getOwnerId(req);

  let body: { title?: unknown; archived?: unknown; share?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
  if (typeof body.archived === "boolean") updates.archived = body.archived;
  if (body.share === true) updates.shareToken = nanoid(24);
  if (body.share === false) updates.shareToken = null;

  const [updated] = await db
    .update(chatSessions)
    .set(updates)
    .where(and(eq(chatSessions.id, id), eq(chatSessions.ownerId, ownerId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const res = NextResponse.json({ session: updated });
  ensureOwnerCookie(res, req);
  return res;
}

export async function DELETE(request: Request, { params }: Params) {
  const req = request as unknown as import("next/server").NextRequest;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const { id } = await params;
  const ownerId = getOwnerId(req);

  const [updated] = await db
    .update(chatSessions)
    .set({ archived: true, updatedAt: new Date() })
    .where(and(eq(chatSessions.id, id), eq(chatSessions.ownerId, ownerId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const res = NextResponse.json({ ok: true });
  ensureOwnerCookie(res, req);
  return res;
}