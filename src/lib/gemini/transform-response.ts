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

function buildSocraticQuestion(finalAnswer: string, studyTip: string | null): Solution['socraticQuestion'] {
  const tip = studyTip?.trim();
  const explanation = tip
    ? `${tip} The correct answer is ${finalAnswer}.`
    : `The correct answer is ${finalAnswer}.`;

  return {
    question: 'Based on the solution above, which answer matches the final result?',
    options: [finalAnswer, 'A different result', 'Cannot be determined', 'None of the above'],
    correctAnswer: 0,
    explanation,
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
    };
  }

  const identifiedProblem = raw.identifiedProblem?.trim() || 'Homework problem';
  const finalAnswer = raw.finalAnswer?.trim() || 'See solution steps';
  const solutionSteps = Array.isArray(raw.solutionSteps)
    ? raw.solutionSteps.filter((step) => typeof step === 'string' && step.trim().length > 0)
    : [];

  const solution: Solution = {
    directAnswer: finalAnswer,
    steps: solutionSteps.length > 0 ? buildSteps(solutionSteps) : buildSteps([finalAnswer]),
    socraticQuestion: buildSocraticQuestion(finalAnswer, raw.studyTip),
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
  };
}
