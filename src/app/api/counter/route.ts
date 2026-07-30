import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const increment = url.searchParams.get('inc') === 'true';

    const endpoint = increment
      ? 'https://api.counterapi.dev/v1/studenthelp-john-wilbert-gamis/views/up'
      : 'https://api.counterapi.dev/v1/studenthelp-john-wilbert-gamis/views/';

    const res = await fetch(endpoint, { cache: 'no-store' });
    
    if (!res.ok) {
      // Fallback endpoint if needed
      const fallbackRes = await fetch('https://api.counterapi.dev/v1/studenthelp-john-wilbert-gamis/views/up', { cache: 'no-store' });
      const fallbackData = await fallbackRes.json();
      return NextResponse.json({ count: fallbackData.count ?? 1 });
    }

    const data = await res.json();
    const count = typeof data.count === 'number' ? data.count : 1;

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching real-time counter:', error);
    return NextResponse.json({ count: 1 });
  }
}
