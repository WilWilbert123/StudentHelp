// src/types/homework.ts
export interface HomeworkSubmission {
  id: string;
  imageUrl: string;
  extractedText: string;
  subject: string;
  language: string;
  solution: Solution;
  timestamp: string;
}

export interface Solution {
  directAnswer: string;
  steps: Step[];
  socraticQuestion: SocraticQuestion;
}

export interface Step {
  title: string;
  description: string;
  explanation: string;
  tip?: string;
}

export interface SocraticQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  optionExplanations?: string[];
  hint?: string;
}

export interface HomeworkChatContext {
  extractedText?: string;
  subject?: string;
  finalAnswer?: string;
  studyTip?: string | null;
  stepsSummary?: string;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type TutorAnalysisStatus =
  | 'SOLVED_SUCCESS'
  | 'SOLVED_PARTIAL'
  | 'REJECTED_BLURRY'
  | 'REJECTED_INCOMPLETE'
  | 'REJECTED_INVALID';

export interface TutorGeminiResponse {
  status: TutorAnalysisStatus;
  canSolve: boolean;
  userMessage: string;
  subject: string;
  language: 'English' | 'Tagalog' | 'Taglish';
  identifiedProblem: string | null;
  solutionSteps: string[];
  finalAnswer: string | null;
  studyTip: string | null;
  confidence: number;
}

export interface UserProfile {
  name: string;
}

export interface AnalysisResponse {
  status: TutorAnalysisStatus;
  canSolve: boolean;
  userMessage: string;
  subject: string;
  language: 'English' | 'Tagalog' | 'Taglish';
  extractedText: string;
  solution: Solution | null;
  studyTip?: string | null;
  confidence?: number;
}