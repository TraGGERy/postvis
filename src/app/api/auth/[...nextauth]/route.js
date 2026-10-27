import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Clerk authentication is active." });
}

export async function POST() {
  return NextResponse.json({ message: "Clerk authentication is active." });
}
