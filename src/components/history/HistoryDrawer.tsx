// src/components/history/HistoryDrawer.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, BookOpen, ChevronRight, Trash2 } from 'lucide-react';
import { getSubmissionHistory } from '@/lib/utils';
import { HomeworkSubmission } from '@/types/homework';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (submission: HomeworkSubmission) => void;
}

export default function HistoryDrawer({ isOpen, onClose, onSelect }: HistoryDrawerProps) {
  const [history, setHistory] = useState<HomeworkSubmission[]>([]);

  // Fetch history dynamically every time the drawer opens
  useEffect(() => {
    if (isOpen) {
      const data = getSubmissionHistory();
      setHistory(data || []);
    }
  }, [isOpen]);

  // Handle ESC key press to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = (item: HomeworkSubmission) => {
    onSelect(item);
    onClose();
  };

  const formatDate = (timestamp: number | string) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-drawer-title"
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 id="history-drawer-title" className="font-display text-lg font-bold text-foreground">
                  Submission History
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                  <div className="p-4 rounded-full bg-accent/50 text-muted-foreground mb-4">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    No history found
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Questions you upload and submit will appear here for easy reference later.
                  </p>
                </div>
              ) : (
                history.map((item, index) => (
                  <button
                    key={item.id || index}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full text-left p-4 rounded-xl border border-border/80 bg-background hover:border-primary/50 hover:bg-accent/40 active:scale-[0.99] transition-all group focus:outline-none focus:ring-2 focus:ring-primary relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {item.subject || 'General'}
                      </span>
                      {item.timestamp && (
                        <span className="text-xs text-muted-foreground/80 shrink-0">
                          {formatDate(item.timestamp)}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-foreground line-clamp-2 leading-relaxed mb-3">
                      {item.extractedText || 'No description provided.'}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                      <span className="uppercase tracking-wider font-semibold text-[10px]">
                        {item.language || 'EN'}
                      </span>
                      <span className="text-primary font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Review Answer <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}