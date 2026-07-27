// src/components/header/NameModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { setUserName } from '@/lib/utils';

interface NameModalProps {
  isOpen: boolean;
  initialName?: string;
  onClose: (name: string) => void;
}

export default function NameModal({ isOpen, initialName = '', onClose }: NameModalProps) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state when initialName updates (e.g., editing existing name)
  useEffect(() => {
    setName(initialName);
  }, [initialName, isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, name, initialName]);

  const isValid = name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const trimmed = name.trim();
    setUserName(trimmed);
    onClose(trimmed);
  };

  const handleDismiss = () => {
    // Keep initial name if closing without submitting valid new text
    onClose(initialName || name.trim());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleDismiss}
            aria-hidden="true"
            className="fixed inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-2xl z-10"
          >
            {/* Close Button (shown only if a name already exists) */}
            {initialName && (
              <button
                type="button"
                onClick={handleDismiss}
                className="absolute top-4 right-4 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 id="modal-title" className="font-display text-2xl font-bold tracking-tight text-foreground">
                {initialName ? 'Update Your Profile' : 'Welcome to StudentHelp 👋'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {initialName
                  ? 'Change how your display name appears across the app.'
                  : 'Enter your name to personalize your learning experience.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="user-name-input" className="sr-only">
                  Your Name
                </label>
                <input
                  id="user-name-input"
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  maxLength={40}
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium text-base"
                />
              </div>

              <button
                type="submit"
                disabled={!isValid}
                className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                {initialName ? 'Save Changes' : 'Continue'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}