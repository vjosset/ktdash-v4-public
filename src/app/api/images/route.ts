import { getAuthSession } from '@/lib/auth';
import { resizeImage, saveImage } from '@/lib/utils/images';
import { OpService, RosterService } from '@/services';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Disable Next.js body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export async function POST(req: NextRequest) {
  try {
    // Validate user - Must be logged in
    const session = await getAuthSession()
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

    // Parse form data
    console.log("Parsing form data...");
    const formData = await req.formData();
    const type = formData.get('type')?.toString();
    const rosterId = formData.get('rosterId')?.toString();
    const opId = formData.get('opId')?.toString();
    const file = formData.get('image') as File | null;
    
    console.log("Got input fields:", { type, rosterId, opId });

    // Validate inputs
    if (!type || !rosterId || (type === 'op' && !opId)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Get the roster
    const roster = await RosterService.getRoster(rosterId);
    if (!roster || roster.userId != session.user.userId) {
      return NextResponse.json({ error: 'Roster not found' }, { status: 404 });
    }

    if (type === 'op' && !roster?.ops?.some((op) => op.opId === opId)) {
      return NextResponse.json({ error: 'Operative not found' }, { status: 404 });
    }

    // Process the image
    const filename = type === 'roster' ? `roster_${rosterId}.jpg` : `op_${opId}.jpg`;
    const resizedBuffer = await resizeImage(file, 900, 600);
    const publicUrl = await saveImage(resizedBuffer, session.user.userId, rosterId, filename);

    // Update the roster or op record
    if (type === 'roster') {
      await RosterService.updateRoster(rosterId, { hasCustomPortrait: true });
    } else if (type === 'op' && opId) {
      await OpService.updateOp(opId, { hasCustomPortrait: true });
    }

    // Done
    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (err) {
    // Something went wrong
    return NextResponse.json({ error: 'Upload failed', details: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Validate user - Must be logged in
    const session = await getAuthSession()
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

    // Parse form data
    console.log("Parsing form data...");
    const formData = await req.formData();
    const type = formData.get('type')?.toString();
    const rosterId = formData.get('rosterId')?.toString();
    const opId = formData.get('opId')?.toString();
    
    console.log("Got input fields:", { type, rosterId, opId });

    // Validate inputs
    if (!type || !rosterId || (type === 'op' && !opId)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the roster
    const roster = await RosterService.getRoster(rosterId);
    if (!roster || roster.userId != session.user.userId) {
      return NextResponse.json({ error: 'Roster not found' }, { status: 404 });
    }

    if (type === 'op' && !roster?.ops?.some((op) => op.opId === opId)) {
      return NextResponse.json({ error: 'Operative not found' }, { status: 404 });
    }

    const filename = type === 'roster' ? `roster_${rosterId}.jpg` : `op_${opId}.jpg`;

    // Delete the image
    const baseDir = path.join(process.cwd(), 'public', 'uploads');
    console.log("Deleting file:", path.join(baseDir, `user_${session.user.userId}`, `roster_${rosterId}`, filename));
    await fs.unlink(path.join(uploadDir, `user_${session.user.userId}`, `roster_${rosterId}`, filename))

    // Update the roster or op record
    if (type === 'roster') {
      await RosterService.updateRoster(rosterId, { hasCustomPortrait: false });
    } else if (type === 'op' && opId) {
      await OpService.updateOp(opId, { hasCustomPortrait: false });
    }
    
    // Done
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    // Something went wrong
    return NextResponse.json({ error: 'Delete failed', details: String(err) }, { status: 500 });
  }
}
