// src/components/solution/SolutionViewer.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Solution } from '@/types/homework';
import StepperAccordion from './StepperAccordion';
import SocraticCheck from './SocraticCheck';

interface SolutionViewerProps {
  solution: Solution;
  imageUrl: string;
  extractedText: string;
}

export default function SolutionViewer({ solution, imageUrl, extractedText }: SolutionViewerProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Image Preview & Extracted Text */}
        <div className="space-y-4">
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <img 
              src={imageUrl} 
              alt="Homework scan" 
              className="w-full h-auto max-h-[400px] object-contain"
            />
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Extracted Text</h4>
            <p className="text-foreground/80 text-sm leading-relaxed">{extractedText}</p>
          </div>
        </div>

        {/* Right: Solution Panel */}
        <div className="space-y-4">
          {/* Direct Answer Banner */}
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Direct Answer</span>
              </div>
              {showAnswer ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence>
              {showAnswer && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <div className="p-4 rounded-lg bg-secondary text-secondary-foreground">
                    <p className="font-medium">{solution.directAnswer}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    👆 Try to solve it yourself before peeking!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step-by-Step Solution */}
          <div className="border border-border rounded-xl p-4 bg-card">
            <h4 className="font-medium text-foreground mb-4">Step-by-Step Solution</h4>
            <StepperAccordion steps={solution.steps} />
          </div>

          {/* Socratic Question */}
          <SocraticCheck question={solution.socraticQuestion} />
        </div>
      </div>
    </div>
  );
}