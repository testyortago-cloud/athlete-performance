import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

function parsePrivateKey(): string {
  const raw = process.env.FIREBASE_PRIVATE_KEY!;
  console.log('[Firebase] Key length:', raw.length, '| starts with:', raw.substring(0, 30), '| ends with:', raw.substring(raw.length - 30));
  let key = raw.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n').trim();
  return key;
}

function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: parsePrivateKey(),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
    });
  }
  return getApps()[0];
}

export function getBucket() {
  getFirebaseApp();
  return getStorage().bucket();
}
