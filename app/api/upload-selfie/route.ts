import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = (formData.get('image') || formData.get('file')) as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const randomStr = Math.random().toString(36).substring(7);
    const filename = `selfie_${Date.now()}_${randomStr}.jpg`;

    // Attempt to write to public/uploads directory for disk backup
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
    } catch (e) {
      // Ignore filesystem errors on read-only serverless platforms
    }

    // Return the self-contained Base64 Data URL so the image displays 100% reliably across all networks, phones, and laptops!
    return NextResponse.json({ url: dataUrl, fallbackUrl: `/uploads/${filename}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
