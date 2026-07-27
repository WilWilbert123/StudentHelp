'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/header/Header';
import PhotoUploader from '@/components/upload/PhotoUploader';
import SolutionViewer from '@/components/solution/SolutionViewer';
import HistoryDrawer from '@/components/history/HistoryDrawer';
import { AnalysisResponse, HomeworkSubmission } from '@/types/homework';
import { addSubmissionToHistory } from '@/lib/utils';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [submission, setSubmission] = useState<HomeworkSubmission | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = async (imageUrl: string) => {
    setIsProcessing(true);
    setError(null);

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
            <PhotoUploader
              onUploadComplete={handleUploadComplete}
              isProcessing={isProcessing}
            />
            {error && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm">
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
              />
            </motion.section>
          )}
        </motion.div>
      </main>

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={(submission) => setSubmission(submission)}
      />
    </div>
  );
}
