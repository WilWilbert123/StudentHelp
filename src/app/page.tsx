'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/header/Header';
import HomeworkAssistant from '@/components/upload/PhotoUploader';
import SolutionViewer from '@/components/solution/SolutionViewer';
import HistoryDrawer from '@/components/history/HistoryDrawer';
import { AnalysisResponse, HomeworkChatContext, HomeworkSubmission } from '@/types/homework';
import { addSubmissionToHistory } from '@/lib/utils';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [submission, setSubmission] = useState<HomeworkSubmission | null>(null);
  const [studyTip, setStudyTip] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const homeworkContext: HomeworkChatContext | null = submission
    ? {
        extractedText: submission.extractedText,
        subject: submission.subject,
        finalAnswer: submission.solution.directAnswer,
        studyTip,
        stepsSummary: submission.solution.steps
          .map((step, index) => `${index + 1}. ${step.explanation}`)
          .join(' '),
      }
    : uploadedImageUrl
      ? {}
      : null;

  const handleUploadComplete = async (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    setIsProcessing(true);
    setError(null);
    setStudyTip(null);

    try {
      const response = await fetch('/api/analyze-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to analyze homework');
      }

      const data: AnalysisResponse = await response.json();

      if (!data.canSolve || !data.solution) {
        setSubmission(null);
        setError(data.userMessage || 'Unable to analyze this homework image. Please try again.');
        return;
      }

      const newSubmission: HomeworkSubmission = {
        id: Date.now().toString(),
        imageUrl,
        extractedText: data.extractedText,
        subject: data.subject,
        language: data.language,
        solution: data.solution,
        timestamp: new Date().toISOString(),
      };

      setSubmission(newSubmission);
      addSubmissionToHistory(newSubmission);
      setStudyTip(data.studyTip ?? null);

      if (data.status === 'SOLVED_PARTIAL') {
        setError(data.userMessage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      console.error('Analysis error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onHistoryToggle={() => setIsHistoryOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Upload Section */}
          <section>
            <HomeworkAssistant
              onUploadComplete={handleUploadComplete}
              isProcessing={isProcessing}
              imageUrl={uploadedImageUrl}
              homeworkContext={homeworkContext}
            />
            {error && (
              <div className={`mt-4 p-4 rounded-xl border text-sm ${
                submission
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              }`}>
                {error}
              </div>
            )}
          </section>

          {/* Solution Section */}
          {submission && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SolutionViewer
                solution={submission.solution}
                imageUrl={submission.imageUrl}
                extractedText={submission.extractedText}
                studyTip={studyTip}
              />
            </motion.section>
          )}
        </motion.div>
      </main>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={(selectedSubmission) => {
          setSubmission(selectedSubmission);
          setUploadedImageUrl(selectedSubmission.imageUrl);
          setStudyTip(null);
          setError(null);
        }}
      />
    </div>
  );
}
