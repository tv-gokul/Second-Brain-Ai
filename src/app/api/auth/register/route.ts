import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// CRITICAL FIX: Bypasses static pre-rendering evaluation during 'npm run build'
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Read the raw body text first to bypass any internal parsing hitches
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }

    const { email, password, name } = JSON.parse(rawBody);

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    console.error("Registration endpoint crash:", error);
    return NextResponse.json({ error: "Internal server processing error" }, { status: 500 });
  }
}