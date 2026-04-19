// src/app/api/admin/scaffold/route.ts
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user.roles.includes("admin")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { files } = await request.json();

    if (!Array.isArray(files)) {
      return NextResponse.json(
        { message: "Invalid payload: files array required" },
        { status: 400 },
      );
    }

    const results = [];

    for (const file of files) {
      const { path: relativePath, content } = file;
      const absolutePath = path.join(process.cwd(), relativePath);
      const directory = path.dirname(absolutePath);

      // Create directory recursive
      await mkdir(directory, { recursive: true });

      // Write file (overwrites if exists)
      await writeFile(absolutePath, content, "utf8");

      results.push({ path: relativePath, status: "success" });
    }

    return NextResponse.json({ message: "Scaffolding complete", results });
  } catch (error: unknown) {
    console.error("Scaffold error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
