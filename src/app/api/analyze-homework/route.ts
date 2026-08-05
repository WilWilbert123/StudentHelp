import { NextResponse } from 'next/server';
import { extractAndParseJSON } from '@/lib/gemini/parse-json';
import { TUTOR_RESPONSE_SCHEMA, TUTOR_SYSTEM_PROMPT } from '@/lib/gemini/tutor-prompt';
import {
  normalizeTutorResponse,
  transformTutorResponse,
} from '@/lib/gemini/transform-response';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
] as const;

async function callGeminiModel(
  model: string,
  apiKey: string,
  base64Image: string,
  mimeType: string
): Promise<{ ok: true; parsed: unknown } | { ok: false; status?: number; error: string }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: TUTOR_SYSTEM_PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
          responseSchema: TUTOR_RESPONSE_SCHEMA,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return {
      ok: false,
      status: response.status,
      error: `Gemini error (${response.status}): ${errorText.substring(0, 300)}`,
    };
  }

  const data = await response.json();
  const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    return {
      ok: false,
      error: `Model ${model} returned empty response`,
    };
  }

  console.log(
    `[Gemini] ${model} raw response (first 200 chars):`,
    textContent.substring(0, 200)
  );

  try {
    const parsed = extractAndParseJSON(textContent);
    return { ok: true, parsed };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to parse JSON response from Gemini',
    };
  }
}

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
    }

    const apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5,
    ].filter(Boolean) as string[];

    if (apiKeys.length === 0) {
      return NextResponse.json(
        { error: 'No GEMINI_API_KEY found in .env.local' },
        { status: 500 }
      );
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/png';

    let lastError: string | null = null;
    let sawRateLimit = false;

    for (const [index, model] of GEMINI_MODELS.entries()) {
      let modelUnavailable = false;

      if (index > 0) {
        const delayMs = sawRateLimit ? 2000 : 1000;
        console.log(`[Analyze] Waiting ${delayMs / 1000}s before trying next model: ${model}...`);
        await sleep(delayMs);
      }

      for (const [keyIndex, apiKey] of apiKeys.entries()) {
        try {
          console.log(`[Analyze] Trying Gemini model: ${model} with key ${keyIndex + 1}/${apiKeys.length}`);

          const result = await callGeminiModel(model, apiKey, base64Image, mimeType);

          if (!result.ok) {
            lastError = result.error;

            if (result.status === 429) {
              sawRateLimit = true;
              lastError = 'Rate limited (429) — free tier quota may be hit. Try again later or upgrade at https://ai.google.dev/pricing';
              console.log(`[Gemini] ${model} (key ${keyIndex + 1}): 429, trying next key...`);
              continue;
            }

            if (result.status === 404 || result.status === 403) {
              console.log(`[Gemini] ${model} (key ${keyIndex + 1}): ${result.status}, trying next model...`);
              modelUnavailable = true;
              break;
            }

            console.log(`[Gemini] ${model} (key ${keyIndex + 1}) failed: ${result.error}`);
            continue;
          }

          const tutorResponse = normalizeTutorResponse(result.parsed);
          const analysis = transformTutorResponse(tutorResponse);

          if (!analysis.canSolve) {
            return NextResponse.json(analysis);
          }

          if (!analysis.solution) {
            throw new Error('Solvable response missing solution payload');
          }

          return NextResponse.json(analysis);
        } catch (err) {
          lastError = err instanceof Error ? err.message : 'Unknown model error';
          console.log(`[Gemini] ${model} (key ${keyIndex + 1}) failed: ${lastError}`);
        }
      }
    }

    const status = sawRateLimit ? 503 : 500;
    return NextResponse.json(
      { error: lastError || 'All Gemini models failed' },
      { status }
    );
  } catch (error) {
    console.error('Error analyzing homework:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze homework' },
      { status: 500 }
    );
  }
}
