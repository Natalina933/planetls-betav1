// app/api/upload/avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

// Rate limiting simple (à améliorer avec Redis en production)
const uploadAttempts = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = uploadAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(time => now - time < 60000); // 1 minute

  if (recentAttempts.length >= 5) {
    return false;
  }

  uploadAttempts.set(ip, [...recentAttempts, now]);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Trop de tentatives. Attendez 1 minute." },
        { status: 429 }
      );
    }

    // Récupération du fichier
    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Validation du type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé. Utilisez JPEG, PNG ou WEBP." },
        { status: 400 }
      );
    }

    // Validation de la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux. Maximum 5MB." },
        { status: 400 }
      );
    }

    // Création du dossier si nécessaire
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
    } catch {
      // Le dossier existe déjà, on continue
    }

    // Génération d'un nom unique
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);

    // Conversion du fichier en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sauvegarde du fichier
    await writeFile(filePath, buffer);

    // URL publique
    const publicUrl = `/uploads/avatars/${uniqueFilename}`;

    return NextResponse.json({
      url: publicUrl,
      filename: uniqueFilename,
      size: file.size,
      type: file.type,
    });

  } catch (err) {
    console.error("Erreur upload avatar:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier" },
      { status: 500 }
    );
  }
}

// Optionnel : Endpoint DELETE pour supprimer un avatar
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Nom de fichier manquant" },
        { status: 400 }
      );
    }

    // Sécurité : empêcher la traversée de répertoires
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, sanitizedFilename);

    const { unlink } = await import("fs/promises");
    await unlink(filePath);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Erreur suppression avatar:", err);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}