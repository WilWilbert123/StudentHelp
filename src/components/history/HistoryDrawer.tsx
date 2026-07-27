// src/components/history/HistoryDrawer.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock, 
  BookOpen, 
  ChevronRight, 
  Trash2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  getSubmissionHistory, 
  clearSubmissionHistory, 
  deleteSubmission 
} from '@/lib/utils';
import { HomeworkSubmission } from '@/types/homework';
import { cn } from '@/lib/utils';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (submission: HomeworkSubmission) => void;
}

export default function HistoryDrawer({ isOpen, onClose, onSelect }: HistoryDrawerProps) {
  const [history, setHistory] = useState<HomeworkSubmission[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Fetch history dynamically every time the drawer opens
  useEffect(() => {
    if (isOpen) {
      const data = getSubmissionHistory();
      setHistory(data || []);
      setShowClearConfirm(false);
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

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent button click
    
    if (deletingId === id) return; // Prevent multiple clicks
    
    setDeletingId(id);
    
    // Small delay for animation
    setTimeout(() => {
      const success = deleteSubmission(id);
      if (success) {
        setHistory(prev => prev.filter(item => item.id !== id));
        setDeleteSuccess(`Item deleted successfully`);
        setTimeout(() => setDeleteSuccess(null), 2000);
      }
      setDeletingId(null);
    }, 300);
  };

  const handleClearAll = () => {
    if (showClearConfirm) {
      // Actually clear
      clearSubmissionHistory();
      setHistory([]);
      setShowClearConfirm(false);
      setDeleteSuccess('All history cleared');
      setTimeout(() => setDeleteSuccess(null), 2000);
    } else {
      // Show confirmation
      setShowClearConfirm(true);
    }
  };

  const cancelClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowClearConfirm(false);
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return '';
    }
  };

  // Helper to get preview text
  const getPreviewText = (item: HomeworkSubmission) => {
    if (item.extractedText) {
      return item.extractedText.length > 80 
        ? item.extractedText.substring(0, 80) + '...' 
        : item.extractedText;
    }
    return 'No description provided.';
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
                {history.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                    {history.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Clear All Button */}
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className={cn(
                      "p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-destructive",
                      showClearConfirm 
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                        : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    )}
                    aria-label={showClearConfirm ? "Confirm clear all history" : "Clear all history"}
                  >
                    {showClearConfirm ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Clear All Confirmation Banner */}
            <AnimatePresence>
              {showClearConfirm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 py-3 bg-destructive/10 border-b border-destructive/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span>Delete all {history.length} items?</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={cancelClearAll}
                        className="px-3 py-1 text-xs font-medium rounded-lg bg-background hover:bg-accent transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleClearAll}
                        className="px-3 py-1 text-xs font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                      >
                        Delete All
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {deleteSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-6 py-2 bg-green-500/10 border-b border-green-500/20 text-sm text-green-600 dark:text-green-400 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {deleteSuccess}
                </motion.div>
              )}
            </AnimatePresence>

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
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full text-left p-4 pr-12 rounded-xl border border-border/80 bg-background hover:border-primary/50 hover:bg-accent/40 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-primary relative overflow-hidden"
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
                        {getPreviewText(item)}
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

                    {/* Delete Button - positioned at top right of each item */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      disabled={deletingId === item.id}
                      className={cn(
                        "absolute top-3 right-3 p-1.5 rounded-lg transition-all",
                        "opacity-0 group-hover:opacity-100 focus:opacity-100",
                        "hover:bg-destructive/10 hover:text-destructive",
                        "text-muted-foreground/50",
                        deletingId === item.id && "opacity-100 pointer-events-none"
                      )}
                      aria-label="Delete this item"
                    >
                      {deletingId === item.id ? (
                        <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer with stats */}
            {history.length > 0 && (
              <div className="px-6 py-3 border-t border-border bg-secondary/20">
                <p className="text-xs text-muted-foreground text-center">
                  {history.length} {history.length === 1 ? 'item' : 'items'} in history
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}