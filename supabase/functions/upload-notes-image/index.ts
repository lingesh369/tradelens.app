import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const noteType = formData.get('noteType') as string || 'general';

    if (!file) {
      return errorResponse('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('Invalid file type. Only images are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return errorResponse('File too large. Maximum size is 5MB.');
    }

    const supabase = createServiceClient();

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${noteType}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('notes-images')
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('notes-images')
      .getPublicUrl(fileName);

    return successResponse({
      url: urlData.publicUrl,
      path: fileName,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return errorResponse(error.message, 500);
  }
});
