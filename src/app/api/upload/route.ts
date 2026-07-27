import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Please upload an image file' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image must be less than 5MB' },
        { status: 400 }
      );
    }

    // Check env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: `Missing environment variables. NEXT_PUBLIC_SUPABASE_URL: ${!!supabaseUrl}, SUPABASE_SERVICE_ROLE_KEY: ${!!serviceRoleKey}` },
        { status: 500 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'homework-scans';

    console.log(`[Upload API] Uploading to ${bucketName}/${fileName} on ${supabaseUrl}`);

    // Convert File to ArrayBuffer then base64
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Build base64 string manually to avoid encoding issues
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64File = btoa(binary);

    // Use Supabase Storage REST API directly (avoids JWT verification issues with the JS client)
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${fileName}`;

    console.log(`[Upload API] Upload URL: ${uploadUrl}`);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': file.type,
        'x-upsert': 'false',
      },
      body: new Uint8Array(arrayBuffer),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`[Upload API] Upload failed with status ${uploadResponse.status}:`, errorText);

      // If 404/ bucket not found, try creating the bucket
      if (uploadResponse.status === 404) {
        console.log(`[Upload API] Bucket "${bucketName}" not found, creating...`);

        // Try to create the bucket via REST API
        const createBucketResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: bucketName,
            name: bucketName,
            public: true,
            file_size_limit: 5242880,
          }),
        });

        if (!createBucketResponse.ok) {
          const createError = await createBucketResponse.text();
          console.error(`[Upload API] Failed to create bucket:`, createError);
          return NextResponse.json(
            { error: `Cannot create bucket "${bucketName}". Please create it manually in Supabase Dashboard → Storage. Error: ${createError}` },
            { status: 500 }
          );
        }

        console.log(`[Upload API] Bucket created, retrying upload...`);

        // Retry upload
        const retryResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': file.type,
            'x-upsert': 'false',
          },
          body: new Uint8Array(arrayBuffer),
        });

        if (!retryResponse.ok) {
          const retryError = await retryResponse.text();
          return NextResponse.json(
            { error: `Upload failed after bucket creation: ${retryError}` },
            { status: 500 }
          );
        }

        // Success after bucket creation
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
        console.log('[Upload API] Upload successful, URL:', publicUrl);
        return NextResponse.json({ imageUrl: publicUrl });
      }

      // If 401/403 - auth error, the service role key is likely wrong
      if (uploadResponse.status === 401 || uploadResponse.status === 403) {
        return NextResponse.json(
          { error: `Authentication failed (${uploadResponse.status}). Your SUPABASE_SERVICE_ROLE_KEY may be incorrect or from a different project. Please verify in Supabase Dashboard → Project Settings → API.` },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: `Upload failed (${uploadResponse.status}): ${errorText.substring(0, 200)}` },
        { status: 500 }
      );
    }

    // Success
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
    console.log('[Upload API] Upload successful, URL:', publicUrl);
    return NextResponse.json({ imageUrl: publicUrl });
  } catch (error: any) {
    console.error('[Upload API] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

