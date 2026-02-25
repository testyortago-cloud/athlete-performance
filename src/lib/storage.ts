import { getBucket } from './firebase';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadAthletePhoto(file: File, athleteName: string): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  const sanitized = athleteName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `profiles/${sanitized}/${Date.now()}.${ext}`;

  const bucket = getBucket();
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileRef = bucket.file(path);

  await fileRef.save(buffer, {
    metadata: { contentType: file.type },
  });

  await fileRef.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}
