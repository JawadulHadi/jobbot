import { NextResponse } from "next/server";

const COOKIE_NAME = "jobbot_auth";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function POST(request: Request) {
  const user = process.env.APP_BASIC_AUTH_USER;
  const pass = process.env.APP_BASIC_AUTH_PASSWORD;
  if (!user || !pass) {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503 }
    );
  }

  let body: { username?: unknown; password?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!safeEqual(username, user) || !safeEqual(password, pass)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}