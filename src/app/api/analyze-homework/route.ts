import { NextResponse } from 'next/server';

/**
 * Extract and parse JSON from Gemini's response text.
 * Handles markdown fences, trailing commas, and unescaped characters.
 */
function extractAndParseJSON(text: string): any {
  let cleaned = text.trim();
  
  // Try to extract content from code blocks first
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Find the first { ... } JSON object
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No JSON object found in response');
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  // Try standard parsing first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // If standard parsing fails, log the error and try cleaning
    const parseError = (e as Error).message;
    console.log(`[JSON Parse] Initial parse failed: ${parseError}`);
  }

  // Strategy 1: Replace all unescaped newlines/tabs inside string values
  // We track whether we're inside a double-quoted string
  let result = '';
  let inString = false;
  let escapeNext = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escapeNext) {
      result += ch;
      escapeNext = false;
      continue;
    }
    if (ch === '\\') {
      result += ch;
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (inString && (ch === '\n' || ch === '\r')) {
      result += '\\n';
      continue;
    }
    if (inString && ch === '\t') {
      result += '\\t';
      continue;
    }
    if (!inString && (ch === '\n' || ch === '\r')) {
      result += ' ';
      continue;
    }
    if (!inString && ch === '\t') {
      result += ' ';
      continue;
    }
    result += ch;
  }

  // Remove trailing commas before closing braces/brackets
  result = result.replace(/,(\s*[}\]])/g, '$1');

  try {
    return JSON.parse(result);
  } catch (e) {
    const parseError = (e as Error).message;
    console.log(`[JSON Parse] Strategy 1 failed: ${parseError}`);
  }

  // Strategy 2: Even more aggressive — reconstruct JSON from scratch
  // Extract individual fields using regex patterns
  try {
    const subjectMatch = result.match(/"subject"\s*:\s*"([^"]+)"/);
    const languageMatch = result.match(/"language"\s*:\s*"([^"]+)"/);
    const extractedTextMatch = result.match(/"extractedText"\s*:\s*"([\s\S]*?)"\s*,\s*"solution"/);
    
    if (subjectMatch && languageMatch && extractedTextMatch) {
      const subject = subjectMatch[1];
      const language = languageMatch[1];
      const extractedText = extractedTextMatch[1].replace(/\\n/g, '\n');
      
      // Find the solution object (everything from "solution": { to the end)
      const solutionStart = result.indexOf('"solution"');
      if (solutionStart !== -1) {
        const solutionPart = '{' + result.substring(solutionStart);
        const solutionObj = JSON.parse(solutionPart);
        
        return {
          subject,
          language,
          extractedText,
          solution: solutionObj.solution,
        };
      }
    }
  } catch (e) {
    console.log('[JSON Parse] Strategy 2 failed');
  }

  // Last resort: log the raw text for debugging
  const preview = text.length > 500 ? text.substring(0, 500) + '...' : text;
  console.log(`[JSON Parse] All strategies failed. Raw preview: ${preview}`);
  throw new Error(`Failed to parse JSON response from Gemini`);
}

/**
 * Helper to sleep/delay for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image URL provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No GEMINI_API_KEY found in .env.local' },
        { status: 500 }
      );
    }

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/png';

    // List of models to try in order
    const models = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
    ];

    let lastError: string | null = null;

    for (const [index, model] of models.entries()) {
      try {
        console.log(`[Analyze] Trying Gemini model: ${model}`);

        // Add a 2-second delay between retries (when not the first model)
        if (index > 0) {
          console.log(`[Analyze] Waiting 2s before trying ${model}...`);
          await sleep(2000);
        }

        // Updated prompt with better Socratic question instructions
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an AI tutor helping a student with homework. Analyze the image and return ONLY valid JSON.

RULES:
- Return ONLY a raw JSON object. NO markdown, NO code fences, NO backticks, NO extra text whatsoever.
- The JSON must be parseable by JSON.parse().
- Keep extractedText short — use single line, no newlines. If you must use newlines, escape them as \\n.
- Escape any double quotes inside string values as \\".

Required JSON structure:
{
  "subject": "Math",
  "language": "English",
  "extractedText": "text here",
  "solution": {
    "directAnswer": "answer",
    "steps": [
      {"title": "Step 1", "description": "brief", "explanation": "detailed"}
    ],
    "socraticQuestion": {
      "question": "What is the total amount?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Step-by-step explanation of the correct answer"
    }
  }
}

IMPORTANT INSTRUCTIONS:
1. Subject must be: Math, Science, English, Filipino, Aralin Panlipunan, or General.
2. Language must be: English, Tagalog, or Taglish.
3. Provide 3-4 steps.
4. correctAnswer is 0-based index of the correct option.

🔴 CRITICAL: The Socratic Question MUST test the SAME problem as the direct answer, but with slightly different numbers or a different angle to check understanding. For example:
- If directAnswer is "85 cents" from "3 twenty-cent coins + 5 five-cent coins"
- Then socraticQuestion should ask: "What is the total if you had 4 twenty-cent coins instead of 3, but still 5 five-cent coins?"
- The correctAnswer should reflect the new calculation (105 cents)

⚠️ The Socratic question should NEVER have a different answer from the direct answer UNLESS it's testing a variation of the SAME concept. The question should clearly relate to the original problem.`
                    },
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
                maxOutputTokens: 2048,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          const status = response.status;

          if (status === 429) {
            lastError = 'Rate limited (429) — free tier quota may be hit. Try again later or upgrade at https://ai.google.dev/pricing';
            console.log(`[Gemini] ${model}: 429, waiting 3s then trying next model...`);
            await sleep(3000);
            continue;
          }
          if (status === 404 || status === 403) {
            lastError = `Model ${model} not available (${status})`;
            console.log(`[Gemini] ${model}: ${status}, trying next...`);
            continue;
          }
          throw new Error(`Gemini error (${status}): ${errorText.substring(0, 300)}`);
        }

        const data = await response.json();
        const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
          lastError = `Model ${model} returned empty response`;
          console.log(`[Gemini] ${model}: empty response, trying next...`);
          continue;
        }

        // Extract and parse JSON
        console.log(`[Gemini] ${model} raw response (first 200 chars):`, textContent.substring(0, 200));
        const result = extractAndParseJSON(textContent);

        // Validate required fields
        if (!result.subject || !result.language || !result.extractedText || !result.solution) {
          throw new Error('Response missing required fields');
        }

        // Validate Socratic question structure
        if (result.solution.socraticQuestion) {
          const sq = result.solution.socraticQuestion;
          if (!sq.question || !sq.options || !Array.isArray(sq.options) || sq.options.length < 2) {
            console.warn('[Analyze] Invalid Socratic question structure, using fallback');
            // Provide a fallback Socratic question based on the direct answer
            result.solution.socraticQuestion = {
              question: "Based on the solution above, which answer is correct?",
              options: [
                result.solution.directAnswer,
                "Alternative answer 1",
                "Alternative answer 2",
                "Alternative answer 3"
              ],
              correctAnswer: 0,
              explanation: `The correct answer is ${result.solution.directAnswer}.`
            };
          }
        } else {
          // Provide a fallback Socratic question
          result.solution.socraticQuestion = {
            question: "Based on the solution above, which answer is correct?",
            options: [
              result.solution.directAnswer,
              "Alternative answer 1",
              "Alternative answer 2",
              "Alternative answer 3"
            ],
            correctAnswer: 0,
            explanation: `The correct answer is ${result.solution.directAnswer}.`
          };
        }

        return NextResponse.json(result);
      } catch (err: any) {
        lastError = err.message;
        console.log(`[Gemini] ${model} failed: ${err.message}`);
      }
    }

    // All models failed
    return NextResponse.json(
      { error: lastError || 'All Gemini models failed' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error analyzing homework:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze homework' },
      { status: 500 }
    );
  }
}