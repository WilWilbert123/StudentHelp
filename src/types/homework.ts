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
}

export interface SocraticQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface UserProfile {
  name: string;
}

export interface AnalysisResponse {
  subject: string;
  language: 'English' | 'Tagalog' | 'Taglish';
  extractedText: string;
  solution: Solution;
}