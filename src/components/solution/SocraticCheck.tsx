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
  Lightbulb,
  HelpCircle,
  RotateCcw,
  BookOpenCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { SocraticQuestion } from '@/types/homework';

interface SocraticCheckProps {
  question: SocraticQuestion;
}

export default function SocraticCheck({ question }: SocraticCheckProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const correct = index === question.correctAnswer;
    setIsCorrect(correct);
    setScore(correct ? 1 : 0);

    if (correct) {
      // Trigger subtle celebratory confetti
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
    }

    setTimeout(() => setShowExplanation(true), 300);
  };

  const resetQuiz = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
    setShowHint(false);
    setScore(null);
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-gradient-to-br from-card via-card to-secondary/10 shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">Socratic Knowledge Check</h4>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Multiple Choice
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Test your understanding with realistic distractor options</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {question.hint && selectedAnswer === null && (
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 px-2.5 py-1 rounded-lg transition-colors border border-amber-500/20"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
              </button>
            )}

            {selectedAnswer !== null && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={resetQuiz}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Question Body */}
      <div className="p-6 space-y-6">
        {/* Hint Box */}
        <AnimatePresence>
          {showHint && question.hint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5"
            >
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Helpful Hint: </span>
                {question.hint}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3"
        >
          <div className="p-1.5 rounded-lg bg-secondary/50 flex-shrink-0 mt-0.5">
            <BookOpenCheck className="w-4 h-4 text-primary" />
          </div>
          <p className="text-foreground/90 leading-relaxed font-medium">
            {question.question}
          </p>
        </motion.div>

        {/* Realistic Options List */}
        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === question.correctAnswer;
            const isWrongSelection = isSelected && !isCorrectAnswer;
            const showResult = selectedAnswer !== null;
            const optionExplanation = question.optionExplanations?.[index];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="space-y-2"
              >
                <button
                  onClick={() => handleSelect(index)}
                  disabled={showResult}
                  className={cn(
                    'relative w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all duration-300 flex items-center justify-between group',
                    // Default state before selection
                    !showResult && 'border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-md cursor-pointer',
                    // Selected correct answer
                    isSelected && isCorrectAnswer && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-lg shadow-emerald-500/10',
                    // Selected wrong answer
                    isSelected && isWrongSelection && 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 shadow-lg shadow-rose-500/10',
                    // Correct answer when wrong option was picked
                    showResult && isCorrectAnswer && !isSelected && 'border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20',
                    // Unselected wrong choices after submission
                    showResult && !isSelected && !isCorrectAnswer && 'opacity-40 border-border/50'
                  )}
                >
                  <div className="flex items-center gap-4 flex-1 pr-3">
                    <span className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 shadow-sm',
                      !showResult && 'bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground',
                      isSelected && isCorrectAnswer && 'bg-emerald-500 text-white',
                      isSelected && isWrongSelection && 'bg-rose-500 text-white',
                      showResult && isCorrectAnswer && !isSelected && 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold'
                    )}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className={cn(
                      'text-sm text-foreground/90 font-medium leading-normal',
                      isSelected && 'font-semibold'
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
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                      </motion.div>
                    )}
                    {showResult && isCorrectAnswer && !isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500/60 shrink-0" />
                    )}
                  </AnimatePresence>
                </button>

                {/* Per-option detailed explanation badge upon submission */}
                <AnimatePresence>
                  {showResult && isSelected && optionExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={cn(
                        'mx-2 p-3 rounded-lg text-xs leading-relaxed border',
                        isCorrectAnswer
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
                      )}
                    >
                      <span className="font-semibold">Analysis: </span>
                      {optionExplanation}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Result Feedback Banner */}
        <AnimatePresence>
          {selectedAnswer !== null && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              className={cn(
                'rounded-xl p-5 border-2 shadow-sm',
                isCorrect 
                  ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/30' 
                  : 'border-rose-300 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/30'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'p-2 rounded-xl flex-shrink-0',
                  isCorrect ? 'bg-emerald-200/60 dark:bg-emerald-900/40' : 'bg-rose-200/60 dark:bg-rose-900/40'
                )}>
                  {isCorrect ? (
                    <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className={cn(
                    'font-semibold text-sm sm:text-base',
                    isCorrect ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
                  )}>
                    {isCorrect 
                      ? '🎉 Outstanding! You selected the correct answer.' 
                      : `💡 Keep learning! Option ${String.fromCharCode(65 + question.correctAnswer)} was the correct choice.`}
                  </p>
                  
                  {/* General Explanation */}
                  {question.explanation && (
                    <div className="pt-2 border-t border-border/40">
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        <span className="font-semibold text-foreground">Detailed Takeaway: </span>
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress & Score Bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span>Score: {score !== null ? `${score}/1 (100%)` : '0/1'}</span>
            <span className="h-3 w-px bg-border" />
            <span className="text-foreground/70">Mastery Mode</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>{selectedAnswer !== null ? (isCorrect ? 'Concept Mastered!' : 'Reviewing Concept') : 'Select Option A, B, C, or D'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}