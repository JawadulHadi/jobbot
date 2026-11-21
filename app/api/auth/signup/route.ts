import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  let body: { email?: unknown; password?: unknown; name?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : null;

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email and password (min 8 chars) are required." },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((r) => r[0]);
  if (existing) {
    return NextResponse.json({ error: "Email already registered." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(users)
    .values({ email, password: hashed, name })
    .returning({ id: users.id, email: users.email, name: users.name });

  return NextResponse.json({ ok: true, user: created }, { status: 201 });
}