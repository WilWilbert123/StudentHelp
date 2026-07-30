'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Pencil, History, BookOpen, Eye, Loader2 } from 'lucide-react';
import { getUserName } from '@/lib/utils';
import NameModal from './NameModal';

interface HeaderProps {
  onHistoryToggle: () => void;
}

export default function Header({ onHistoryToggle }: HeaderProps) {
  const [name, setName] = useState('');
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewsCount, setViewsCount] = useState<number | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const savedName = getUserName();
    if (!savedName) {
      setIsNameModalOpen(true);
    } else {
      setName(savedName);
    }

    // Real-Time Visitor Count Fetching
    const fetchRealTimeVisitors = async () => {
      try {
        const isNewSession = !sessionStorage.getItem('visited_session');
        if (isNewSession) {
          sessionStorage.setItem('visited_session', 'true');
        }

        const res = await fetch(`/api/counter?inc=${isNewSession ? 'true' : 'false'}`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === 'number') {
            setViewsCount(data.count);
          }
        }
      } catch (err) {
        console.error('Failed to fetch real-time visitor count:', err);
      }
    };

    fetchRealTimeVisitors();
  }, []);

  const handleNameUpdate = (newName: string) => {
    if (newName) setName(newName);
    setIsNameModalOpen(false);
  };

  // Prevent SSR hydration mismatches
  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md px-4 py-3 h-[65px]" />
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Left: Branding & User Profile */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="font-display text-lg font-bold tracking-tight text-foreground hidden sm:inline-block">
                  StudentHelp
                </span>
              </div>

              <div className="h-4 w-px bg-border hidden sm:block" aria-hidden="true" />

              <div className="flex items-center gap-1.5 bg-accent/50 hover:bg-accent px-2.5 py-1 rounded-full border border-border/50 transition-colors">
                <span className="text-xs sm:text-sm font-medium text-foreground max-w-[120px] sm:max-w-[160px] truncate">
                  {name ? `Hi, ${name}` : 'Welcome'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsNameModalOpen(true)}
                  className="p-0.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
                  aria-label="Edit display name"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Right: Actions & Real-Time Visitor Counter */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Real-Time Visit Counter Badge */}
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 border border-border/80 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-secondary"
                title="Real-time global visitor count"
              >
                <Eye className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
                {viewsCount !== null ? (
                  <span className="font-bold font-mono text-xs">{viewsCount.toLocaleString()}</span>
                ) : (
                  <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                )}
                <span className="hidden sm:inline text-[10px] text-muted-foreground">views</span>
              </div>

              <button
                type="button"
                onClick={onHistoryToggle}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Open interaction history"
              >
                <History className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      <NameModal
        isOpen={isNameModalOpen}
        initialName={name}
        onClose={handleNameUpdate}
      />
    </>
  );
}
