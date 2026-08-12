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
    const randomStr = Math.random().toString(36).substring(7);
    const filename = `selfie_${Date.now()}_${randomStr}.jpg`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // directory might exist
    }

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
