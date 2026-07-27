// src/components/solution/StepperAccordion.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Step } from '@/types/homework';

interface StepperAccordionProps {
  steps: Step[];
}

export default function StepperAccordion({ steps }: StepperAccordionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleStep = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={false}
          className="border border-border rounded-xl overflow-hidden bg-card"
        >
          <button
            onClick={() => toggleStep(index)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
                expandedIndex === index 
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              )}>
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
            <ChevronDown className={cn(
              'w-5 h-5 text-muted-foreground transition-transform flex-shrink-0',
              expandedIndex === index && 'rotate-180'
            )} />
          </button>

          <AnimatePresence>
            {expandedIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1 text-muted-foreground border-t border-border">
                  <p className="text-foreground/90 leading-relaxed">
                    {step.explanation}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}