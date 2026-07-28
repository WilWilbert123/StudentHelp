export async function fetchImageAsBase64(
  imageUrl: string
): Promise<{ base64Image: string; mimeType: string }> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  const mimeType = imageResponse.headers.get('content-type') || 'image/png';

  return { base64Image, mimeType };
}
