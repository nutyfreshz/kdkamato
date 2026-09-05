import { getDriveClient } from '../../../lib/google';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const drive = getDriveClient();

  if (!id || !drive) {
    return new Response('Image unavailable', { status: 404 });
  }

  try {
    const meta = await drive.files.get({ fileId: id, fields: 'mimeType,name' });
    const result = await drive.files.get(
      { fileId: id, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    return new Response(Buffer.from(result.data), {
      status: 200,
      headers: {
        'Content-Type': meta.data.mimeType || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'Content-Disposition': `inline; filename="${String(meta.data.name || 'image').replace(/"/g, '')}"`
      }
    });
  } catch (error) {
    console.error('Drive image proxy error', error);
    return new Response('Image unavailable', { status: 404 });
  }
}
