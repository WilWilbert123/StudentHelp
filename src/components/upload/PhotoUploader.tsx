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
  X,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { HomeworkChatContext } from '@/types/homework';

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
  const cameraFallbackRef = useRef<HTMLInputElement>(null);
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

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const openCamera = async (mode: 'environment' | 'user' = facingMode) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback to native mobile camera if WebRTC is blocked (e.g. non-HTTPS local network)
      if (cameraFallbackRef.current) {
        cameraFallbackRef.current.click();
      } else {
        setCameraError('Camera access is blocked by your browser. Try using HTTPS or localhost.');
      }
      return;
    }

    stopCamera();
    setIsCameraOpen(true);
    setIsCameraLoading(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setCameraStream(stream);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please check permissions or try another device.');
    } finally {
      setIsCameraLoading(false);
    }
  };

  const closeCamera = () => {
    stopCamera();
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    openCamera(nextMode);
  };

  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((err) => console.error('Video play error:', err));
    }
  }, [isCameraOpen, cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const takeCameraSnapshot = () => {
    if (!videoRef.current || !cameraStream) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    stopCamera();
    setIsCameraOpen(false);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        uploadToApi(file);
      }
    }, 'image/jpeg', 0.85);
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
        <input
          ref={cameraFallbackRef}
          type="file"
          accept="image/*"
          capture="environment"
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
                  onClick={() => openCamera('environment')}
                  className="px-4 py-2 rounded-xl border-2 border-border bg-card text-foreground text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2 cursor-pointer"
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

      {/* Live Camera Viewfinder Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950/80">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-sm sm:text-base text-gray-100">Camera Viewfinder</h3>
                </div>
                <button
                  type="button"
                  onClick={closeCamera}
                  className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title="Close Camera"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Viewport */}
              <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
                {isFlashing && (
                  <div className="absolute inset-0 bg-white z-20 transition-opacity duration-150" />
                )}

                {isCameraLoading ? (
                  <div className="flex flex-col items-center gap-3 text-amber-400">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    <p className="text-sm font-medium text-gray-300">Starting camera stream...</p>
                  </div>
                ) : cameraError ? (
                  <div className="p-6 text-center space-y-3">
                    <XCircle className="w-10 h-10 text-red-500 mx-auto" />
                    <p className="text-sm text-gray-300">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => openCamera(facingMode)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={cn(
                        "w-full h-full object-cover",
                        facingMode === 'user' && "scale-x-[-1]"
                      )}
                    />
                    
                    {/* Corner Guides Overlay */}
                    <div className="absolute inset-6 border-2 border-dashed border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-t-2 border-l-2 border-amber-400 -mt-1 -ml-1 rounded-tl-lg" />
                        <div className="w-6 h-6 border-t-2 border-r-2 border-amber-400 -mt-1 -mr-1 rounded-tr-lg" />
                      </div>
                      <div className="text-center text-xs font-medium text-white/90 bg-black/60 backdrop-blur-sm py-1.5 px-3 rounded-full self-center border border-white/10 shadow-lg">
                        Position your homework in frame
                      </div>
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-b-2 border-l-2 border-amber-400 -mb-1 -ml-1 rounded-bl-lg" />
                        <div className="w-6 h-6 border-b-2 border-r-2 border-amber-400 -mb-1 -mr-1 rounded-br-lg" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Controls */}
              <div className="p-4 bg-gray-950/90 border-t border-gray-800 flex items-center justify-around">
                <button
                  type="button"
                  onClick={closeCamera}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {/* Shutter Button */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={takeCameraSnapshot}
                  disabled={isCameraLoading || !!cameraError}
                  className={cn(
                    "relative group p-1.5 rounded-full border-4 border-amber-500/50 hover:border-amber-400 transition-all shadow-xl shadow-amber-500/20 cursor-pointer",
                    (isCameraLoading || !!cameraError) && "opacity-50 pointer-events-none"
                  )}
                  title="Capture photo"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-500 group-hover:bg-amber-400 flex items-center justify-center transition-colors">
                    <Camera className="w-6 h-6 text-gray-950" />
                  </div>
                </motion.button>

                {/* Flip Camera Button */}
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  disabled={isCameraLoading || !!cameraError}
                  className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
                  title="Switch camera mode"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
  imageUrl?: string | null;
  homeworkContext?: HomeworkChatContext | null;
  isAnalyzing?: boolean;
}

// =============== CHAT MESSAGE CONTENT WITH COLLAPSIBLE SPOILER ANSWER ===============
function ChatMessageContent({ content, isDark }: { content: string; isDark: boolean }) {
  const [showAnswer, setShowAnswer] = useState(false);

  // Check if content contains "Final answer:"
  const finalAnswerIndex = content.indexOf('Final answer:');

  if (finalAnswerIndex !== -1) {
    const prefixText = content.slice(0, finalAnswerIndex).trim();
    const answerText = content.slice(finalAnswerIndex + 'Final answer:'.length).trim();

    return (
      <div className="space-y-2">
        {prefixText && (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {prefixText}
          </p>
        )}

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAnswer(!showAnswer)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm cursor-pointer",
              showAnswer
                ? "bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-500/40"
                : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/20"
            )}
          >
            {showAnswer ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-amber-600" />}
            <span>{showAnswer ? 'Hide Answer' : 'Show Answer'}</span>
          </button>
        </div>

        <AnimatePresence>
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={cn(
                "p-3 rounded-xl border text-xs sm:text-sm font-medium mt-1.5 leading-relaxed",
                isDark 
                  ? "bg-gray-800/90 border-gray-600 text-amber-300" 
                  : "bg-amber-50/80 border-amber-200 text-amber-900"
              )}>
                <span className="font-bold">Final Answer: </span>
                <span>{answerText}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <p className="text-sm whitespace-pre-wrap leading-relaxed">
      {content}
    </p>
  );
}

const INITIAL_GREETING =
  "👋 Hello! I'm your AI homework assistant. Upload a homework image on the left, then ask me anything about it — I'll explain steps, clarify concepts, and help you learn.";

const CONNECTED_GREETING =
  "📎 I'm connected to your uploaded homework image. Ask me about any step, concept, or part of the problem you don't understand!";

export function AIAssistant({
  className,
  imageUrl = null,
  homeworkContext = null,
  isAnalyzing = false,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: INITIAL_GREETING,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const analysisNoticeShownRef = useRef(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!imageUrl) return;

    analysisNoticeShownRef.current = false;
    setMessages([
      {
        id: Date.now().toString(),
        type: 'assistant',
        content: isAnalyzing
          ? '📷 Homework image received! I am analyzing it now — feel free to ask questions once analysis finishes, or ask about what you see in the image.'
          : homeworkContext?.extractedText
            ? `${CONNECTED_GREETING}\n\nProblem detected: "${homeworkContext.extractedText.slice(0, 120)}${homeworkContext.extractedText.length > 120 ? '...' : ''}"`
            : CONNECTED_GREETING,
        timestamp: new Date(),
      },
    ]);
  }, [imageUrl]);

  useEffect(() => {
    if (!imageUrl || isAnalyzing || !homeworkContext?.extractedText || analysisNoticeShownRef.current) {
      return;
    }

    analysisNoticeShownRef.current = true;
    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `✅ Analysis complete! I can now help with the full solution. Final answer: ${homeworkContext.finalAnswer ?? 'see solution below'}.`,
        timestamp: new Date(),
      },
    ]);
  }, [homeworkContext, imageUrl, isAnalyzing]);

  const sendMessageToAssistant = async (userMessage: string): Promise<string> => {
    const history = messages
      .filter((message) => message.id !== '1')
      .map((message) => ({
        role: message.type === 'user' ? ('user' as const) : ('assistant' as const),
        content: message.content,
      }));

    const response = await fetch('/api/chat-homework', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl,
        message: userMessage,
        history,
        context: homeworkContext,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get a response from the AI assistant');
    }

    return data.reply;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!imageUrl) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'Please upload your homework image first so I can see the problem and help you accurately.',
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await sendMessageToAssistant(userMessage.content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content:
          error instanceof Error
            ? error.message
            : "I encountered an issue processing your question. Could you please rephrase it?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        type: 'assistant',
        content: imageUrl
          ? `${CONNECTED_GREETING}\n\nYour homework image is still connected.`
          : '👋 Chat cleared! Upload a homework image, then ask me anything about it.',
        timestamp: new Date(),
      },
    ]);
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
                {imageUrl
                  ? isAnalyzing
                    ? 'Connected to image • Analyzing...'
                    : 'Connected to your uploaded homework'
                  : 'Upload homework to connect'}
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
      <div 
        ref={chatContainerRef}
        className={cn(
          "flex-1 overflow-y-auto p-4 space-y-3",
          isDark ? "bg-gray-800" : "bg-gray-50"
        )}
      >
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
                <ChatMessageContent content={message.content} isDark={isDark} />
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
              placeholder={
                imageUrl
                  ? 'Ask about your uploaded homework...'
                  : 'Upload homework first, then ask a question...'
              }
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
  imageUrl?: string | null;
  homeworkContext?: HomeworkChatContext | null;
}

export default function HomeworkAssistant({
  onUploadComplete = () => {},
  isProcessing = false,
  imageUrl = null,
  homeworkContext = null,
}: HomeworkAssistantProps) {
  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <PhotoUploader
            onUploadComplete={onUploadComplete}
            isProcessing={isProcessing}
          />
        </div>

        <div className="lg:col-span-1">
          <AIAssistant
            className="h-[600px]"
            imageUrl={imageUrl}
            homeworkContext={homeworkContext}
            isAnalyzing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}