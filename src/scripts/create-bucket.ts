import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Parse .env.local manually (no dotenv dependency)
const envContent = readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { data, error } = await supabase.storage.createBucket('athlete-photos', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket "athlete-photos" already exists.');
    } else {
      console.error('Failed to create bucket:', error.message);
      process.exit(1);
    }
  } else {
    console.log('Bucket created successfully:', data);
  }

  // Verify
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucket = buckets?.find((b) => b.name === 'athlete-photos');
  if (bucket) {
    console.log(`Verified: "athlete-photos" exists | public: ${bucket.public}`);
  }
}

main();
