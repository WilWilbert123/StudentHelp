'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  Brain, 
  AlertCircle,
  Sparkles,
  Trophy,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SocraticQuestion } from '@/types/homework';

interface SocraticCheckProps {
  question: SocraticQuestion;
}

export default function SocraticCheck({ question }: SocraticCheckProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const correct = index === question.correctAnswer;
    setIsCorrect(correct);
    setTimeout(() => setShowExplanation(true), 500);
  };

  const resetQuiz = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-gradient-to-br from-card via-card to-secondary/10 shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Check Your Understanding</h4>
              <p className="text-xs text-muted-foreground">Test your knowledge with this quick question</p>
            </div>
          </div>
          {selectedAnswer !== null && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={resetQuiz}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20"
            >
              Try Again
            </motion.button>
          )}
        </div>
      </div>

      {/* Question Body */}
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3"
        >
          <div className="p-1.5 rounded-lg bg-secondary/50 flex-shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-foreground/90 leading-relaxed font-medium">
            {question.question}
          </p>
        </motion.div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === question.correctAnswer;
            const isWrongSelection = isSelected && !isCorrectAnswer;
            const showResult = selectedAnswer !== null;

            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={!showResult ? { scale: 1.02, x: 4 } : {}}
                whileTap={!showResult ? { scale: 0.98 } : {}}
                onClick={() => handleSelect(index)}
                disabled={showResult}
                className={cn(
                  'relative w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between group',
                  // Default state
                  !showResult && 'border-border hover:border-primary/40 hover:bg-primary/5 hover:shadow-md',
                  // Selected correct
                  isSelected && isCorrectAnswer && 'border-green-500 bg-green-50 dark:bg-green-950/20 shadow-lg shadow-green-500/10',
                  // Selected wrong
                  isSelected && isWrongSelection && 'border-red-500 bg-red-50 dark:bg-red-950/20 shadow-lg shadow-red-500/10',
                  // Show correct answer (when someone else selected wrong)
                  showResult && isCorrectAnswer && !isSelected && 'border-green-500/30 bg-green-50/30 dark:bg-green-950/10',
                  // Disabled state
                  showResult && !isSelected && !isCorrectAnswer && 'opacity-50'
                )}
              >
                <div className="flex items-center gap-4">
                  <span className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all flex-shrink-0',
                    !showResult && 'bg-secondary text-secondary-foreground group-hover:bg-primary/10',
                    isSelected && isCorrectAnswer && 'bg-green-500 text-white',
                    isSelected && isWrongSelection && 'bg-red-500 text-white',
                    showResult && isCorrectAnswer && !isSelected && 'bg-green-500/20 text-green-700 dark:text-green-300'
                  )}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={cn(
                    'text-foreground/90',
                    isSelected && 'font-medium'
                  )}>
                    {option}
                  </span>
                </div>

                {/* Status icon */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      {isCorrectAnswer ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </motion.div>
                  )}
                  {showResult && isCorrectAnswer && !isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-green-400/50" />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Result Feedback */}
        <AnimatePresence>
          {selectedAnswer !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={cn(
                'rounded-xl p-5 border-2',
                isCorrect 
                  ? 'border-green-200 bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-950/30 dark:to-emerald-950/30' 
                  : 'border-red-200 bg-gradient-to-br from-red-50/80 to-rose-50/80 dark:from-red-950/30 dark:to-rose-950/30'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'p-2 rounded-xl flex-shrink-0',
                  isCorrect ? 'bg-green-200/50 dark:bg-green-900/30' : 'bg-red-200/50 dark:bg-red-900/30'
                )}>
                  {isCorrect ? (
                    <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className={cn(
                    'font-semibold',
                    isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  )}>
                    {isCorrect 
                      ? '🎉 Excellent! You got it right!' 
                      : `💡 Not quite. The correct answer was: ${question.options[question.correctAnswer]}`}
                  </p>
                  
                  {/* Explanation */}
                  {question.explanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ delay: 0.3 }}
                      className="pt-2 border-t border-border/50"
                    >
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Explanation:</span> {question.explanation}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span>Question 1 of 1</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              {selectedAnswer !== null ? (isCorrect ? 'Correct!' : 'Try another') : 'Select an answer'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}