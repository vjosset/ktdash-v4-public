import { getAuthSession } from '@/lib/auth';
import { resizeImage, saveImage } from '@/lib/utils/images';
import { OpService } from '@/services';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export async function POST(req: NextRequest, { params }: { params: Promise<{ opId: string }> }) {
  try {
    // Validate user - Must be logged in
    const session = await getAuthSession()
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

    // Parse form data
    const formData = await req.formData();
    const { opId } = await params;
    const file = formData.get('image') as File | null;

    // Validate inputs
    if (!opId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Get the op
    const op = await OpService.getOp(opId);
    if (!op || !op.roster || !op.rosterId || op.roster.userId !== session.user.userId) {
      return NextResponse.json({ error: 'Operative not found' }, { status: 404 });
    }

    // Process the image
    const filename = `op_${opId}.jpg`;
    const resizedBuffer = await resizeImage(file, 900, 600);
    const publicUrl = await saveImage(resizedBuffer, session.user.userId, op.rosterId, filename);

    // Update the op record
    await OpService.updateOp(opId, { hasCustomPortrait: true });

    // Done
    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (err) {
    // Something went wrong
    return NextResponse.json({ error: 'Upload failed', details: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ opId: string }> }) {
  try {
    // Validate user - Must be logged in
    const session = await getAuthSession()
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

    const { opId } = await params;

    const op = await OpService.getOp(opId);
    if (!op || !op.roster || !op.rosterId || op.roster.userId !== session.user.userId) {
      return NextResponse.json({ error: 'Operative not found' }, { status: 404 });
    }

    const filename = `op_${opId}.jpg`;

    // Delete the image
    const baseDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.unlink(path.join(uploadDir, `user_${session.user.userId}`, `roster_${op.rosterId}`, filename))

    // Update the op record
    await OpService.updateOp(opId, { hasCustomPortrait: false });
    
    // Done
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    // Something went wrong
    return NextResponse.json({ error: 'Delete failed', details: String(err) }, { status: 500 });
  }
}
