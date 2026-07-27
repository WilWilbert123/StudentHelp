// src/components/solution/SocraticCheck.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SocraticQuestion } from '@/types/homework';

interface SocraticCheckProps {
  question: SocraticQuestion;
}

export default function SocraticCheck({ question }: SocraticCheckProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSelect = (index: number) => {
    setSelectedAnswer(index);
    setIsCorrect(index === question.correctAnswer);
  };

  return (
    <div className="border border-border rounded-xl p-6 bg-card">
      <h4 className="font-medium text-foreground mb-4">
        Check Your Understanding 📝
      </h4>
      <p className="text-muted-foreground mb-4">{question.question}</p>

      <div className="space-y-2">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={selectedAnswer !== null}
            className={cn(
              'w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between',
              selectedAnswer === null && 'hover:border-primary/50 hover:bg-accent',
              selectedAnswer === index && selectedAnswer === question.correctAnswer && 'border-green-500 bg-green-50 dark:bg-green-950/20',
              selectedAnswer === index && selectedAnswer !== question.correctAnswer && 'border-red-500 bg-red-50 dark:bg-red-950/20',
              selectedAnswer !== null && selectedAnswer !== index && 'opacity-50'
            )}
          >
            <span>{option}</span>
            {selectedAnswer === index && (
              <span>
                {selectedAnswer === question.correctAnswer ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {selectedAnswer !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'mt-4 p-3 rounded-lg text-sm',
            isCorrect ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300'
          )}
        >
          {isCorrect 
            ? '✅ Great job! You got it right!' 
            : `❌ Not quite. The correct answer was: ${question.options[question.correctAnswer]}`}
        </motion.div>
      )}
    </div>
  );
}