import { NextResponse } from "next/server";

import { auth } from "@/auth";

export async function POST() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ user: session.user });
}
