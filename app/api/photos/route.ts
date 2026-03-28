import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { randomUUID } from "crypto";
import { analyzePhotoForTimeline } from "@/lib/analyze-photo-timeline";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = "public/uploads";

/** JPEG, ориентация EXIF. Dynamic import — при падении sharp в контейнере не роняем весь route. */
async function normalizePlantImageBuffer(input: Buffer): Promise<Buffer | null> {
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(input)
      .rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();
  } catch (e) {
    console.warn("Plant photo sharp normalize failed:", e);
    return null;
  }
}

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

    const dir = path.join(process.cwd(), UPLOAD_DIR);
    let url: string;

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);
    const mimeFromClient = file.type || "image/jpeg";

    const normalized = await normalizePlantImageBuffer(buffer);
    let storedMime = "image/jpeg";
    let filename: string;
    if (normalized) {
      buffer = Buffer.from(normalized);
      filename = `${randomUUID()}.jpg`;
    } else {
      const ext = path.extname(file.name || "") || ".jpg";
      filename = `${randomUUID()}${ext}`;
      storedMime = mimeFromClient;
    }

    try {
      await mkdir(dir, { recursive: true });
      const filepath = path.join(dir, filename);
      await writeFile(filepath, buffer);
      url = `/uploads/${filename}`;
    } catch {
      const base64 = buffer.toString("base64");
      url = `data:${storedMime};base64,${base64}`;
    }

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

    // Анализ фото нейросетью для таймлайна (вердикт: норма / отклонения)
    try {
      await analyzePhotoForTimeline(
        photo.id,
        buffer.toString("base64"),
        storedMime,
        { name: plant.name, plantedDate: plant.plantedDate },
        { type: bed.type },
        takenAt,
        user.id
      );
    } catch {
      // не ломаем ответ: фото уже сохранено, анализ можно повторить позже
    }

    const updated = await prisma.photo.findUnique({
      where: { id: photo.id },
    });

    return NextResponse.json(updated ?? photo, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Photos POST error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
