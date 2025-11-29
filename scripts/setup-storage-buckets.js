import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const buckets = [
  {
    id: 'trade-images',
    name: 'trade-images',
    public: true,
    fileSizeLimit: 52428800, // 50 MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  {
    id: 'trade-chart-images',
    name: 'trade-chart-images',
    public: true,
    fileSizeLimit: 52428800,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  {
    id: 'journal-images',
    name: 'journal-images',
    public: true,
    fileSizeLimit: 52428800,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  {
    id: 'notes-images',
    name: 'notes-images',
    public: true,
    fileSizeLimit: 52428800,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  {
    id: 'strategy-images',
    name: 'strategy-images',
    public: false,
    fileSizeLimit: 52428800,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  {
    id: 'profile-pictures',
    name: 'profile-pictures',
    public: true,
    fileSizeLimit: 52428800,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  {
    id: 'traders-profile-about',
    name: 'traders-profile-about',
    public: true,
    fileSizeLimit: 52428800,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  {
    id: 'tradelens',
    name: 'tradelens',
    public: false,
    fileSizeLimit: 52428800,
    allowedMimeTypes: null // Allow any file type
  }
];

async function setupStorageBuckets() {
  console.log('🗄️  Setting up Storage Buckets\n');
  
  for (const bucket of buckets) {
    try {
      // Try to create the bucket
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes
      });
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Bucket "${bucket.name}" already exists, skipping...`);
        } else {
          console.error(`❌ Error creating bucket "${bucket.name}":`, error.message);
        }
      } else {
        console.log(`✅ Created bucket: ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
      }
    } catch (err) {
      console.error(`❌ Unexpected error creating bucket "${bucket.name}":`, err.message);
    }
  }
  
  console.log('\n✨ Storage bucket setup complete!');
  console.log('\n📝 Note: RLS policies are applied via migration 20241124110000_setup_storage_buckets.sql');
}

setupStorageBuckets();
