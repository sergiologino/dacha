import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { randomUUID } from "crypto";

const UPLOAD_DIR = "public/uploads";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const plantId = formData.get("plantId") as string | null;
    const bedId = formData.get("bedId") as string | null;
    const takenAtStr = formData.get("takenAt") as string | null;

    if (!file || !file.size) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    if (!plantId || !bedId) {
      return NextResponse.json({ error: "plantId and bedId are required" }, { status: 400 });
    }

    const plant = await prisma.plant.findFirst({ where: { id: plantId, userId: user.id } });
    if (!plant) return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    const bed = await prisma.bed.findFirst({ where: { id: bedId, userId: user.id } });
    if (!bed) return NextResponse.json({ error: "Bed not found" }, { status: 404 });

    const ext = path.extname(file.name) || ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const dir = path.join(process.cwd(), UPLOAD_DIR);
    await mkdir(dir, { recursive: true });
    const filepath = path.join(dir, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const url = `/uploads/${filename}`;
    const takenAt = takenAtStr ? new Date(takenAtStr) : new Date();

    const photo = await prisma.photo.create({
      data: {
        userId: user.id,
        plantId,
        bedId,
        url,
        takenAt,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (err) {
    console.error("Photos POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
