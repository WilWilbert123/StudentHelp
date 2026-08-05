import { NextResponse } from 'next/server';
import { fetchImageAsBase64 } from '@/lib/gemini/fetch-image';
import { HomeworkChatContext } from '@/types/homework';

const CHAT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
] as const;

interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

function buildSystemInstruction(context?: HomeworkChatContext | null, hasImage?: boolean): string {
  const lines = [
    'You are a friendly AI homework tutor helping a student understand their assignment.',
  ];

  if (hasImage) {
    lines.push('The student can see their homework image on screen — refer to it when helpful.');
  }

  lines.push('Guide them step by step. Explain concepts clearly and use age-appropriate language.');
  lines.push('Do not simply dump the full answer unless they ask for it directly, OR if it is a request for a straight translation or conversion (like text-to-binary or binary-to-text) which you should perform directly and fully.');

  if (context?.subject) {
    lines.push(`Subject: ${context.subject}`);
  }
  if (context?.extractedText) {
    lines.push(`Identified problem: ${context.extractedText}`);
  }
  if (context?.finalAnswer) {
    lines.push(`Known final answer: ${context.finalAnswer}`);
  }
  if (context?.stepsSummary) {
    lines.push(`Solution overview: ${context.stepsSummary}`);
  }
  if (context?.studyTip) {
    lines.push(`Study tip: ${context.studyTip}`);
  }

  if (hasImage) {
    lines.push(
      'Use the attached homework image together with this context when answering follow-up questions.'
    );
  }

  return lines.join('\n');
}

function mapHistoryToGeminiContents(history: ChatHistoryMessage[]) {
  return history.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      imageUrl,
      message,
      history = [],
      context = null,
    }: {
      imageUrl?: string;
      message?: string;
      history?: ChatHistoryMessage[];
      context?: HomeworkChatContext | null;
    } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
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

    let base64Image = null;
    let mimeType = null;
    
    if (imageUrl) {
      const imageData = await fetchImageAsBase64(imageUrl);
      base64Image = imageData.base64Image;
      mimeType = imageData.mimeType;
    }

    const systemInstruction = buildSystemInstruction(context, !!imageUrl);
    const priorMessages = Array.isArray(history)
      ? history.filter(
          (entry) =>
            entry &&
            (entry.role === 'user' || entry.role === 'assistant') &&
            typeof entry.content === 'string' &&
            entry.content.trim().length > 0
        )
      : [];

    const userParts: any[] = [];
    if (base64Image && mimeType) {
      userParts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Image,
        },
      });
    }
    userParts.push({ text: message.trim() });

    const contents = [
      ...mapHistoryToGeminiContents(priorMessages),
      {
        role: 'user',
        parts: userParts,
      },
    ];

    let lastError = 'All Gemini models failed';

    for (const model of CHAT_MODELS) {
      let modelUnavailable = false;

      for (const apiKey of apiKeys) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },
              contents,
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 2048,
              },
            }),
          }
        );

        if (response.status === 429) {
          lastError = 'Rate limited — please wait a moment and try again.';
          continue;
        }

        if (response.status === 404 || response.status === 403) {
          lastError = `Model ${model} is unavailable`;
          modelUnavailable = true;
          break;
        }

        if (!response.ok) {
          const errorText = await response.text();
          lastError = `Gemini error (${response.status}): ${errorText.substring(0, 200)}`;
          continue;
        }

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!reply) {
          lastError = `Model ${model} returned an empty response`;
          continue;
        }

        return NextResponse.json({ reply });
      }
    }

    return NextResponse.json({ error: lastError }, { status: 503 });
  } catch (error) {
    console.error('Chat homework error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}
