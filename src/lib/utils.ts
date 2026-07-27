// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { HomeworkSubmission } from '@/types/homework';

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

// Get submission history with proper typing
export const getSubmissionHistory = (): HomeworkSubmission[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('submissionHistory');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading submission history:', error);
    return [];
  }
};

// Add submission to history
export const addSubmissionToHistory = (submission: HomeworkSubmission): void => {
  if (typeof window === 'undefined') return;
  try {
    const history = getSubmissionHistory();
    // Check if it already exists to avoid duplicates
    const exists = history.some(item => item.id === submission.id);
    if (!exists) {
      history.unshift(submission);
      // Keep only last 50 items to prevent localStorage overflow
      if (history.length > 50) {
        history.length = 50;
      }
      localStorage.setItem('submissionHistory', JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error saving submission history:', error);
  }
};

// Delete a single submission by ID
export const deleteSubmission = (id: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const history = getSubmissionHistory();
    const filtered = history.filter(item => item.id !== id);
    if (filtered.length === history.length) {
      return false; // Nothing was deleted
    }
    localStorage.setItem('submissionHistory', JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting submission:', error);
    return false;
  }
};

// Clear all submission history
export const clearSubmissionHistory = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('submissionHistory', JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing submission history:', error);
  }
};

// Keep for backward compatibility
export const clearHistory = clearSubmissionHistory;