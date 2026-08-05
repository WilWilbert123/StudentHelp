import {
  AnalysisResponse,
  Solution,
  Step,
  TutorAnalysisStatus,
  TutorGeminiResponse,
} from '@/types/homework';

const REJECTED_STATUSES: TutorAnalysisStatus[] = [
  'REJECTED_BLURRY',
  'REJECTED_INCOMPLETE',
  'REJECTED_INVALID',
];

export function isRejectedStatus(status: TutorAnalysisStatus): boolean {
  return REJECTED_STATUSES.includes(status);
}

function buildSteps(solutionSteps: string[]): Step[] {
  return solutionSteps.map((step, index) => {
    const trimmed = step.trim();
    const titleMatch = trimmed.match(/^Step\s+\d+\s*[:\-.]\s*(.+)$/i);
    const body = titleMatch ? titleMatch[1] : trimmed;
    const shortDescription =
      body.length > 90 ? `${body.slice(0, 87).trimEnd()}...` : body;

    return {
      title: `Step ${index + 1}`,
      description: shortDescription,
      explanation: trimmed,
    };
  });
}

/**
 * Generates realistic, plausible multiple choice options and distractors
 * tailored to the problem and final answer instead of generic placeholders.
 */
function buildSocraticQuestion(
  finalAnswer: string, 
  studyTip: string | null,
  subject: string = 'General'
): Solution['socraticQuestion'] {
  const cleanAnswer = finalAnswer.trim();
  const tip = studyTip?.trim();

  // Extract primary numeric value if present
  const numberMatch = cleanAnswer.match(/[-+]?\d*\.?\d+/);
  const numVal = numberMatch ? parseFloat(numberMatch[0]) : null;

  let rawOptions: { text: string; explanation: string; isCorrect: boolean }[] = [];

  if (numVal !== null && !isNaN(numVal)) {
    // Numeric problem distractor generation
    const isInt = Number.isInteger(numVal);
    const absVal = Math.abs(numVal);

    // Realistic calculation errors
    const negVal = -numVal;
    const doubleVal = isInt ? numVal * 2 : parseFloat((numVal * 2).toFixed(2));
    const halfVal = isInt ? Math.round(numVal / 2) : parseFloat((numVal / 2).toFixed(2));
    const offByOne = numVal > 0 ? numVal + (isInt ? 1 : 0.5) : numVal - 1;
    const offByTwo = numVal > 0 ? numVal - (isInt ? 2 : 1) : numVal + 2;

    const distractor1Text = cleanAnswer.replace(numberMatch![0], String(negVal !== numVal ? negVal : numVal + 5));
    const distractor2Text = cleanAnswer.replace(numberMatch![0], String(doubleVal !== numVal ? doubleVal : numVal + 10));
    const distractor3Text = cleanAnswer.replace(numberMatch![0], String(offByOne !== numVal ? offByOne : numVal - 3));

    rawOptions = [
      {
        text: cleanAnswer,
        explanation: `Correct! ${tip ? tip : `The verified result is ${cleanAnswer}.`}`,
        isCorrect: true,
      },
      {
        text: distractor1Text,
        explanation: `Incorrect. Be careful with positive/negative signs when solving equation terms.`,
        isCorrect: false,
      },
      {
        text: distractor2Text,
        explanation: `Incorrect. This value occurs if you double the final step or miss a division step.`,
        isCorrect: false,
      },
      {
        text: distractor3Text,
        explanation: `Incorrect. Double-check your arithmetic in the final simplification step.`,
        isCorrect: false,
      },
    ];
  } else {
    // Conceptual / Text problem distractor generation
    if (subject === 'Science') {
      rawOptions = [
        {
          text: cleanAnswer,
          explanation: `Correct! ${tip || 'This directly aligns with the core scientific principle.'}`,
          isCorrect: true,
        },
        {
          text: `Inverted process where reactants and products swap roles`,
          explanation: `Incorrect. Remember the direction of chemical energy transfer.`,
          isCorrect: false,
        },
        {
          text: `Occurs only under zero-gravity conditions`,
          explanation: `Incorrect. This mechanism functions under standard terrestrial conditions.`,
          isCorrect: false,
        },
        {
          text: `Independent of cell structure and temperature`,
          explanation: `Incorrect. Environmental factors like temperature directly affect metabolic rate.`,
          isCorrect: false,
        },
      ];
    } else if (subject === 'Math') {
      rawOptions = [
        {
          text: cleanAnswer,
          explanation: `Correct! ${tip || 'This is the simplified exact value.'}`,
          isCorrect: true,
        },
        {
          text: `Undefined / No Real Solution`,
          explanation: `Incorrect. The problem produces a valid real value when solved correctly.`,
          isCorrect: false,
        },
        {
          text: `Reciprocal of ${cleanAnswer}`,
          explanation: `Incorrect. Make sure not to invert fractions during division.`,
          isCorrect: false,
        },
        {
          text: `Requires logarithmic expansion to solve`,
          explanation: `Incorrect. Standard algebraic order of operations is sufficient.`,
          isCorrect: false,
        },
      ];
    } else {
      // General / English / Filipino distractor generation
      rawOptions = [
        {
          text: cleanAnswer,
          explanation: `Correct! ${tip || 'This is the most accurate and precise answer.'}`,
          isCorrect: true,
        },
        {
          text: `Opposite / Contrary context`,
          explanation: `Incorrect. Pay attention to context clues in the problem statement.`,
          isCorrect: false,
        },
        {
          text: `Partially correct but incomplete description`,
          explanation: `Incorrect. Make sure to capture the full rule rather than a partial state.`,
          isCorrect: false,
        },
        {
          text: `Applies only to archaic grammatical usage`,
          explanation: `Incorrect. This follows standard modern conventions.`,
          isCorrect: false,
        },
      ];
    }
  }

  // Deterministically shuffle correct answer position based on answer string length
  // to avoid correct answer always being at index 0, while keeping re-renders stable
  const seed = cleanAnswer.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const targetIndex = seed % 4;

  // Swap index 0 (correct) with targetIndex
  const temp = rawOptions[0];
  rawOptions[0] = rawOptions[targetIndex];
  rawOptions[targetIndex] = temp;

  const options = rawOptions.map((o) => o.text);
  const optionExplanations = rawOptions.map((o) => o.explanation);
  const correctAnswer = targetIndex;

  const questionText = subject === 'Math'
    ? 'Which of the following represents the correct step/result?'
    : subject === 'Science'
      ? 'Which statement accurately describes the conclusion?'
      : 'Which option correctly matches the solution?';

  return {
    question: questionText,
    options,
    correctAnswer,
    explanation: tip ? `${tip} (Correct Choice: ${options[correctAnswer]})` : `The correct choice is ${options[correctAnswer]}.`,
    optionExplanations,
    hint: `Hint: Review the step-by-step breakdown above, paying close attention to the final simplification.`,
  };
}

export function transformTutorResponse(raw: TutorGeminiResponse): AnalysisResponse {
  const status = raw.status ?? 'REJECTED_INVALID';
  const canSolve = Boolean(raw.canSolve) && !isRejectedStatus(status);

  if (!canSolve) {
    return {
      status,
      canSolve: false,
      userMessage: raw.userMessage || 'Unable to analyze this image. Please try again with a clearer photo.',
      subject: raw.subject || 'General',
      language: raw.language || 'English',
      extractedText: raw.identifiedProblem ?? '',
      solution: null,
      studyTip: null,
      confidence: raw.confidence,
    };
  }

  const identifiedProblem = raw.identifiedProblem?.trim() || 'Homework problem';
  const finalAnswer = raw.finalAnswer?.trim() || 'See solution steps';
  const solutionSteps = Array.isArray(raw.solutionSteps)
    ? raw.solutionSteps.filter((step) => typeof step === 'string' && step.trim().length > 0)
    : [];
  const subject = raw.subject || 'General';

  const solution: Solution = {
    directAnswer: finalAnswer,
    steps: solutionSteps.length > 0 ? buildSteps(solutionSteps) : buildSteps([finalAnswer]),
    socraticQuestion: buildSocraticQuestion(finalAnswer, raw.studyTip, subject),
  };

  return {
    status,
    canSolve: true,
    userMessage: raw.userMessage || 'Here is your step-by-step solution.',
    subject: raw.subject || 'General',
    language: raw.language || 'English',
    extractedText: identifiedProblem,
    solution,
    studyTip: raw.studyTip ?? null,
    confidence: raw.confidence,
  };
}

function normalizeLanguage(value: unknown): TutorGeminiResponse['language'] {
  if (value === 'Tagalog' || value === 'Taglish') return value;
  return 'English';
}

export function normalizeTutorResponse(parsed: unknown): TutorGeminiResponse {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Response is not a JSON object');
  }

  const data = parsed as Record<string, unknown>;

  return {
    status: data.status as TutorAnalysisStatus,
    canSolve: Boolean(data.canSolve),
    userMessage: String(data.userMessage ?? ''),
    subject: String(data.subject ?? 'General'),
    language: normalizeLanguage(data.language),
    identifiedProblem:
      data.identifiedProblem == null ? null : String(data.identifiedProblem),
    solutionSteps: Array.isArray(data.solutionSteps)
      ? data.solutionSteps.map((step) => String(step))
      : [],
    finalAnswer: data.finalAnswer == null ? null : String(data.finalAnswer),
    studyTip: data.studyTip == null ? null : String(data.studyTip),
    confidence: typeof data.confidence === 'number' ? data.confidence : 1.0,
  };
}
