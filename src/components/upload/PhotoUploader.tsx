'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle2,
  XCircle,
  Send,
  User,
  Bot,
  Sparkles,
  MessageSquare,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

// =============== PHOTO UPLOADER COMPONENT ===============
interface PhotoUploaderProps {
  onUploadComplete: (imageUrl: string) => void;
  isProcessing: boolean;
}

export function PhotoUploader({ onUploadComplete, isProcessing }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  const uploadToApi = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload image');
      }

      onUploadComplete(result.imageUrl);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload image');
      setPreviewUrl(null);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    await uploadToApi(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach(track => track.stop());

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          handleFileUpload(file);
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      console.error('Camera error:', error);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (fileInputRef2.current) fileInputRef2.current.value = '';
  };

  const isLoading = isProcessing || isUploading;

  const isDark = theme === 'dark';

  return (
    <div className="w-full space-y-4">
      <div className="text-left space-y-2">
        <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2">
          <Upload className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          Upload Your Homework
        </h3>
        <p className="text-sm text-muted-foreground">
          Snap a photo or upload an image of your assignment
        </p>
      </div>

      <motion.div
        initial={false}
        animate={{ 
          scale: isDragging ? 1.02 : 1,
          backgroundColor: isDragging ? 'rgba(var(--primary), 0.05)' : 'rgba(var(--background), 0)'
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative rounded-2xl border-2 border-dashed transition-all duration-300',
          isDragging 
            ? 'border-amber-700/70 shadow-lg shadow-amber-700/10' 
            : previewUrl 
              ? 'border-amber-700/30' 
              : 'border-border',
          isLoading && 'opacity-50 pointer-events-none',
          error && 'border-destructive/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        <input
          ref={fileInputRef2}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="p-6">
          {previewUrl ? (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary/50">
                <img 
                  src={previewUrl} 
                  alt="Upload preview" 
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={clearPreview}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                  disabled={isLoading}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-amber-700 rounded-full"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              {isProcessing && !isUploading && (
                <div className="flex items-center justify-center gap-3 text-amber-700 dark:text-amber-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Analyzing your homework...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 py-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "p-4 rounded-2xl transition-all duration-300",
                  isDragging ? "bg-amber-700/10" : "bg-secondary/80"
                )}
              >
                <Upload className={cn(
                  "w-8 h-8 transition-colors",
                  isDragging ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
                )} />
              </motion.div>

              <div className="space-y-1 text-center">
                <p className="text-sm font-medium">
                  {isDragging ? 'Drop your image here' : 'Drag & drop your image'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports JPG, PNG, WEBP (Max 5MB)
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef2.current?.click()}
                  className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium hover:shadow-lg hover:shadow-amber-700/25 transition-all flex items-center gap-2"
                  disabled={isLoading}
                >
                  <ImageIcon className="w-4 h-4" />
                  Choose Image
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCameraCapture}
                  className="px-4 py-2 rounded-xl border-2 border-border bg-card text-foreground text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </motion.button>
              </div>
            </div>
          )}

          {error && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3"
              >
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive/90">{error}</p>
              </motion.div>
            </AnimatePresence>
          )}

          {isProcessing && !isUploading && !previewUrl && (
            <div className="mt-4 flex items-center justify-center gap-3 text-amber-700 dark:text-amber-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Processing...</span>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: CheckCircle2, label: 'AI Powered', color: 'text-amber-700 dark:text-amber-400' },
          { icon: CheckCircle2, label: 'Instant Analysis', color: 'text-amber-600 dark:text-amber-500' },
          { icon: CheckCircle2, label: 'Secure Upload', color: 'text-muted-foreground' },
        ].map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"
          >
            <feature.icon className={cn("w-3 h-3", feature.color)} />
            <span>{feature.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// =============== AI CHAT COMPONENT - WITH DARK MODE SUPPORT ===============
interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  className?: string;
}

export function AIAssistant({ className }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: '👋 Hello! I\'m your AI homework assistant. Ask me anything about your assignments, and I\'ll help you understand and solve problems step by step!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // AI Response Generator - Simulates intelligent responses
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    const lowerMsg = userMessage.toLowerCase();
    
    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    // Intelligent response system
    const responses = {
      math: [
        "Great math question! Let's break this down step by step:\n\n1. First, identify what we know\n2. Apply the appropriate formula\n3. Solve systematically\n\nI can help you work through this!",
        "For this math problem, remember to:\n• Show your work clearly\n• Check your calculations\n• Verify your answer makes sense\n\nWould you like me to guide you through it?"
      ],
      science: [
        "This is a fascinating science topic! Let's think about it scientifically:\n\n• What do we observe?\n• What are the key principles?\n• How can we test our hypothesis?\n\nI'm here to help you understand the concepts!",
        "For scientific problems, it's important to:\n• Understand the fundamentals\n• Apply the scientific method\n• Draw logical conclusions\n\nLet's explore this together!"
      ],
      essay: [
        "For writing essays, consider this structure:\n\n📝 Introduction: Hook your reader\n📝 Body: Develop your arguments\n📝 Conclusion: Wrap up effectively\n\nI can help you brainstorm ideas!",
        "Great essay topic! Here are some tips:\n• Create a strong thesis\n• Use evidence and examples\n• Write clear topic sentences\n\nWhat would you like to focus on?"
      ],
      help: [
        "I'm here to help! Let me know:\n• What subject you're working on\n• What you understand so far\n• Where you're stuck\n\nI'll provide clear explanations and examples!"
      ],
      default: [
        "That's an interesting question! Let me think about that...\n\nHere's what I can do to help:\n• Explain concepts clearly\n• Provide examples\n• Break down complex problems\n\nFeel free to ask for more details!",
        "Great question! To help you best, I'll:\n• Analyze your question carefully\n• Provide relevant information\n• Offer clear explanations\n\nWhat specific aspect would you like to explore?"
      ]
    };

    // Pattern matching for intelligent responses
    if (lowerMsg.includes('math') || lowerMsg.includes('equation') || lowerMsg.includes('solve') || lowerMsg.includes('calculate')) {
      return responses.math[Math.floor(Math.random() * responses.math.length)];
    } else if (lowerMsg.includes('science') || lowerMsg.includes('physics') || lowerMsg.includes('chemistry') || lowerMsg.includes('biology')) {
      return responses.science[Math.floor(Math.random() * responses.science.length)];
    } else if (lowerMsg.includes('essay') || lowerMsg.includes('write') || lowerMsg.includes('paper') || lowerMsg.includes('paragraph')) {
      return responses.essay[Math.floor(Math.random() * responses.essay.length)];
    } else if (lowerMsg.includes('help') || lowerMsg.includes('assist') || lowerMsg.includes('please') || lowerMsg.includes('thanks')) {
      return responses.help[Math.floor(Math.random() * responses.help.length)];
    } else {
      return responses.default[Math.floor(Math.random() * responses.default.length)];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await generateAIResponse(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I encountered an issue processing your question. Could you please rephrase it? I\'m here to help!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: '👋 Chat cleared! How can I help you with your homework today?',
      timestamp: new Date()
    }]);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn("flex flex-col h-[600px] bg-white rounded-2xl border shadow-xl overflow-hidden", className)}>
        <div className="p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-700">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">AI Assistant</h3>
              <p className="text-xs text-gray-500">Powered by Advanced AI</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "flex flex-col h-[600px] rounded-2xl border shadow-xl overflow-hidden",
      isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200",
      className
    )}>
      {/* Chat Header */}
      <div className={cn(
        "p-4 border-b backdrop-blur-sm",
        isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-700 hover:bg-amber-800 transition-colors">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={cn(
                "font-semibold flex items-center gap-2",
                isDark ? "text-white" : "text-gray-800"
              )}>
                AI Assistant
                <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-600 dark:text-green-400 rounded-full font-medium">
                  Online
                </span>
              </h3>
              <p className={cn(
                "text-xs",
                isDark ? "text-gray-400" : "text-gray-500"
              )}>
                Powered by Advanced AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearChat}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
              )}
              title="Clear chat"
            >
              <X className={cn(
                "w-4 h-4",
                isDark ? "text-gray-400" : "text-gray-500"
              )} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className={cn(
        "flex-1 overflow-y-auto p-4 space-y-3",
        isDark ? "bg-gray-800" : "bg-gray-50"
      )}>
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex gap-3 items-start",
                message.type === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                message.type === 'user' 
                  ? "bg-amber-700" 
                  : "bg-amber-600"
              )}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={cn(
                "max-w-[85%] px-4 py-3 rounded-2xl",
                message.type === 'user'
                  ? "bg-amber-700 text-white rounded-tr-sm"
                  : isDark 
                    ? "bg-gray-700 border border-gray-600 text-gray-200 rounded-tl-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
              )}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
                <p className={cn(
                  "text-[10px] mt-1",
                  message.type === 'user' 
                    ? "text-amber-100" 
                    : isDark ? "text-gray-400" : "text-gray-400"
                )}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 items-start"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className={cn(
                "px-4 py-3 rounded-2xl rounded-tl-sm",
                isDark ? "bg-gray-700 border border-gray-600" : "bg-white border border-gray-200"
              )}>
                <div className="flex gap-1">
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 rounded-full bg-amber-600"
                  />
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 rounded-full bg-amber-600"
                  />
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 rounded-full bg-amber-600"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className={cn(
        "p-4 border-t backdrop-blur-sm",
        isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      )}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your homework..."
              className={cn(
                "w-full px-4 py-2.5 pr-10 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-700/50 transition-all",
                isDark 
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"
              )}
              disabled={isLoading}
            />
            <Sparkles className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4",
              isDark ? "text-gray-400" : "text-gray-400"
            )} />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium transition-all flex items-center gap-2",
              (!input.trim() || isLoading) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Ask AI</span>
              </>
            )}
          </motion.button>
        </div>
        <div className={cn(
          "mt-2 text-[10px] text-center",
          isDark ? "text-gray-400" : "text-gray-400"
        )}>
          <span className="flex items-center justify-center gap-4">
            <span>✨ Ask about any subject</span>
            <span>•</span>
            <span>🧠 Get step-by-step help</span>
            <span>•</span>
            <span>📚 Learn at your pace</span>
          </span>
        </div>
      </form>
    </div>
  );
}

// =============== MAIN WRAPPER COMPONENT ===============
interface HomeworkAssistantProps {
  onUploadComplete?: (imageUrl: string) => void;
  isProcessing?: boolean;
}

export default function HomeworkAssistant({ 
  onUploadComplete = () => {},
  isProcessing = false 
}: HomeworkAssistantProps) {
  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Photo Uploader */}
        <div className="lg:col-span-1">
          <PhotoUploader 
            onUploadComplete={onUploadComplete} 
            isProcessing={isProcessing} 
          />
        </div>
        
        {/* Right Side - AI Assistant with Theme Support */}
        <div className="lg:col-span-1">
          <AIAssistant className="h-[600px]" />
        </div>
      </div>
    </div>
  );
}