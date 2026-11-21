import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "jobbot_uid";

export function getOwnerId(request: NextRequest): string {
  const basicUser = process.env.APP_BASIC_AUTH_USER;
  if (basicUser) return `basic:${basicUser}`;
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (cookie) return `anon:${cookie}`;
  return "anon:unknown";
}

export function ensureOwnerCookie(response: NextResponse, request: NextRequest): void {
  if (process.env.APP_BASIC_AUTH_USER) return;
  if (request.cookies.get(COOKIE_NAME)?.value) return;
  const id = crypto.randomUUID();
  response.cookies.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}