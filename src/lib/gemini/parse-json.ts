/**
 * Extract and parse JSON from Gemini's response text.
 * Handles markdown fences, trailing commas, unescaped characters, and truncation.
 */
export function extractAndParseJSON(text: string): unknown {
  let cleaned = text.trim();

  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');

  if (jsonStart === -1) {
    throw new Error('No JSON object found in response');
  }

  cleaned =
    jsonEnd === -1
      ? cleaned.substring(jsonStart)
      : cleaned.substring(jsonStart, jsonEnd + 1);

  const strategies = [
    () => JSON.parse(cleaned),
    () => JSON.parse(sanitizeJsonString(cleaned)),
    () => JSON.parse(repairTruncatedJson(cleaned)),
    () => JSON.parse(repairTruncatedJson(sanitizeJsonString(cleaned))),
  ];

  let lastError: Error | null = null;

  for (const [index, strategy] of strategies.entries()) {
    try {
      return strategy();
    } catch (error) {
      lastError = error as Error;
      if (index === 0) {
        console.log(`[JSON Parse] Initial parse failed: ${lastError.message}`);
      }
    }
  }

  const preview = text.length > 500 ? `${text.substring(0, 500)}...` : text;
  console.log(`[JSON Parse] All strategies failed. Raw preview: ${preview}`);
  throw new Error('Failed to parse JSON response from Gemini');
}

function sanitizeJsonString(input: string): string {
  let result = '';
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

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

    if (!inString && (ch === '\n' || ch === '\r' || ch === '\t')) {
      result += ' ';
      continue;
    }

    result += ch;
  }

  return result.replace(/,(\s*[}\]])/g, '$1');
}

function repairTruncatedJson(input: string): string {
  let repaired = sanitizeJsonString(input.trim());

  // Close an unterminated string literal.
  let inString = false;
  let escapeNext = false;

  for (const ch of repaired) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === '\\') {
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
    }
  }

  if (inString) {
    repaired += '"';
  }

  const stack: string[] = [];
  inString = false;
  escapeNext = false;

  for (const ch of repaired) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === '\\') {
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') stack.push('}');
    if (ch === '[') stack.push(']');
    if (ch === '}' || ch === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === ch) {
        stack.pop();
      }
    }
  }

  // Drop a trailing comma before we close open containers.
  repaired = repaired.replace(/,\s*$/, '');

  while (stack.length > 0) {
    repaired += stack.pop();
  }

  return repaired;
}
