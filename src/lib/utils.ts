// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getUserName = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('studentName') || '';
};

export const setUserName = (name: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('studentName', name);
};

export const getSubmissionHistory = (): any[] => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('submissionHistory') || '[]');
};

export const addSubmissionToHistory = (submission: any): void => {
  if (typeof window === 'undefined') return;
  const history = getSubmissionHistory();
  history.unshift(submission);
  localStorage.setItem('submissionHistory', JSON.stringify(history.slice(0, 20)));
};