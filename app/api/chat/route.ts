import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const { message, system } = await req.json();
  const reply = `Top Bomba AI Demo\nMode: ${system.includes("App") ? "App Builder" : "Content"}\nYou: ${message}`;
  return NextResponse.json({ reply });
}