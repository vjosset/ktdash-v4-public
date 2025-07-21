import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export async function resizeImage(
  file: File,
  width: number,
  height: number
): Promise<Buffer> {
  try {
    // Create temp file path
    const tempPath = path.join(uploadDir, `${Date.now()}-${Math.random().toString(36).substring(2)}`);
    
    // Write the file buffer to temp location
    const bytes = await file.arrayBuffer();
    await fs.writeFile(tempPath, Buffer.from(bytes));

    // Resize and crop the image
    const buffer = await sharp(tempPath)
      .rotate() // This automatically reads rotation from EXIF
      .resize(width, height, { 
        fit: 'cover', 
        position: 'center'
      })
      .jpeg({ 
        quality: 90,
        force: true // Always output as JPEG
      })
      .toBuffer();

    // Cleanup temp file
    await fs.unlink(tempPath);

    return buffer;
  } catch (error) {
    throw new Error(`Failed to resize image: ${error}`);
  }
}

export async function saveImage(
  buffer: Buffer,
  userId: string,
  rosterId: string,
  filename: string
): Promise<string> {
  try {
    // Build destination path
    const baseDir = path.join(uploadDir, `user_${userId}`, `roster_${rosterId}`);
    await fs.mkdir(baseDir, { recursive: true });

    const destFilePath = path.join(baseDir, filename);

    // Save the buffer
    await fs.writeFile(destFilePath, buffer);

    // Return the public URL
    return `/uploads/user_${userId}/roster_${rosterId}/${filename}`;
  } catch (error) {
    throw new Error(`Failed to save image: ${error}`);
  }
}
