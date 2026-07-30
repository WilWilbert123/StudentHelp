'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Lightbulb, 
  Copy, 
  CheckCheck,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Solution } from '@/types/homework';
import StepperAccordion from './StepperAccordion';
import SocraticCheck from './SocraticCheck';

interface SolutionViewerProps {
  solution: Solution;
  imageUrl: string;
  extractedText: string;
  studyTip?: string | null;
}

export default function SolutionViewer({ solution, imageUrl, extractedText, studyTip }: SolutionViewerProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(solution.directAnswer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Solution Breakdown
          </h2>
          <p className="text-sm text-muted-foreground">
            Review the solution steps on the right and test your knowledge on the left
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>AI Generated</span>
        </div>
      </div>

      {/* Balanced 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Image/OCR Text + Socratic Quiz */}
        <div className="space-y-6">
          {/* Tabs & Image/OCR Card */}
          <div className="space-y-3">
            <div className="flex gap-2 bg-secondary/30 p-1 rounded-xl border border-border/50">
              <button
                onClick={() => setActiveTab('image')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'image'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
              >
                <ImageIcon className="w-4 h-4" />
                Image
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'text'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
              >
                <FileText className="w-4 h-4" />
                Extracted Text
              </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'image' ? (
                <motion.div
                  key="image"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="relative border border-border rounded-2xl overflow-hidden bg-card shadow-lg"
                >
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  )}
                  <img 
                    src={imageUrl} 
                    alt="Homework scan" 
                    className={cn(
                      'w-full h-auto max-h-[380px] object-contain transition-opacity duration-500',
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    )}
                    onLoad={() => setImageLoaded(true)}
                  />
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">
                    Original Upload
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="border border-border rounded-2xl p-5 bg-card shadow-lg min-h-[200px] max-h-[380px] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">OCR Extracted Text</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">
                      {extractedText.split(' ').length} words
                    </span>
                  </div>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono text-xs sm:text-sm">
                    {extractedText}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Socratic Question placed on the Left column to balance height! */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SocraticCheck question={solution.socraticQuestion} />
          </motion.div>
        </div>

        {/* Right Column: Direct Answer & Step-by-Step Breakdown */}
        <div className="space-y-6">
          {/* Direct Answer Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-border rounded-2xl overflow-hidden bg-card shadow-lg"
          >
            <div className="px-6 py-4 bg-gradient-to-r from-primary/5 via-primary/5 to-transparent border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Lightbulb className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Direct Answer</h4>
                    <p className="text-xs text-muted-foreground">Click to reveal or copy the solution</p>
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors relative"
                  aria-label="Copy answer"
                >
                  {copied ? (
                    <CheckCheck className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-6">
              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className="w-full flex items-center justify-between group"
              >
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {showAnswer ? 'Hide solution' : 'Show solution'}
                </span>
                <motion.div
                  animate={{ rotate: showAnswer ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {showAnswer ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </motion.div>
              </button>

              <AnimatePresence>
                {showAnswer && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-5 rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/30 border border-primary/10">
                      <p className="font-semibold text-foreground leading-relaxed text-sm sm:text-base">
                        {solution.directAnswer}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <ArrowRight className="w-3 h-3 text-primary" />
                      <span>Review the step-by-step breakdown below!</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Step-by-Step Solution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StepperAccordion steps={solution.steps} />
          </motion.div>

          {/* Study Tip Box */}
          {studyTip && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-primary/20 rounded-2xl p-5 bg-primary/5"
            >
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                <span className="font-semibold text-primary">Study tip:</span> {studyTip}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}