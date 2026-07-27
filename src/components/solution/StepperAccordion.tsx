'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  Sparkles,
  Clock,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Step } from '@/types/homework';

interface StepperAccordionProps {
  steps: Step[];
}

export default function StepperAccordion({ steps }: StepperAccordionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
    // Mark as completed when expanded (user has viewed it)
    if (expandedIndex !== index) {
      setCompletedSteps(prev => new Set(prev).add(index));
    }
  };

  const isStepCompleted = (index: number) => {
    return completedSteps.has(index);
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-primary/5 via-primary/5 to-transparent border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Step-by-Step Solution</h4>
              <p className="text-xs text-muted-foreground">
                {steps.length} steps • Expand each to learn more
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{completedSteps.size}/{steps.length} viewed</span>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 space-y-3">
        {steps.map((step, index) => {
          const isExpanded = expandedIndex === index;
          const isCompleted = isStepCompleted(index);
          const isLast = index === steps.length - 1;

          return (
            <motion.div
              key={index}
              initial={false}
              className={cn(
                'rounded-xl border-2 transition-all duration-300',
                isExpanded 
                  ? 'border-primary/30 shadow-md shadow-primary/5' 
                  : 'border-border hover:border-primary/20',
                isCompleted && !isExpanded && 'border-green-500/20'
              )}
            >
              <button
                onClick={() => toggleStep(index)}
                className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-accent/30 transition-colors rounded-xl"
              >
                {/* Step number with status */}
                <div className="flex-shrink-0 mt-0.5">
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300',
                    isExpanded 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                      : isCompleted
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-2 border-green-500/30'
                        : 'bg-secondary text-secondary-foreground'
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      'font-semibold transition-colors',
                      isExpanded ? 'text-foreground' : 'text-foreground/80'
                    )}>
                      {step.title}
                    </p>
                    {isCompleted && !isExpanded && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                        Viewed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                    {step.description}
                  </p>
                </div>

                {/* Expand indicator */}
                <motion.div
                  animate={{ 
                    rotate: isExpanded ? 180 : 0,
                    scale: isExpanded ? 1.1 : 1
                  }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 mt-1"
                >
                  <ChevronDown className={cn(
                    'w-5 h-5 transition-colors',
                    isExpanded ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </motion.div>
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-2 border-t border-border/50">
                      <div className="relative pl-4 before:absolute before:left-0 before:top-1 before:w-0.5 before:h-full before:bg-primary/20">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                          <div className="space-y-3">
                            <p className="text-foreground/90 leading-relaxed">
                              {step.explanation}
                            </p>
                            
                            {/* Optional: Additional info or tips */}
                            {step.tip && (
                              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium text-primary">💡 Tip:</span> {step.tip}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress indicator for this step */}
                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-primary" />
                          <span>Step {index + 1} of {steps.length}</span>
                        </div>
                        {!isLast && (
                          <button
                            onClick={() => toggleStep(index + 1)}
                            className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-medium text-xs"
                          >
                            Next Step →
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Completion progress bar */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">
              {completedSteps.size}/{steps.length} steps viewed
            </span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedSteps.size / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}