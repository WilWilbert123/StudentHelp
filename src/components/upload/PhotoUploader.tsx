'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle2,
  XCircle,
  
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  onUploadComplete: (imageUrl: string) => void;
  isProcessing: boolean;
}

export default function PhotoUploader({ onUploadComplete, isProcessing }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const uploadToApi = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload via API route
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

      console.log('Upload successful, URL:', result.imageUrl);
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header with animated gradient */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center justify-center gap-2">
          
          Upload Your Homework
        </h3>
        <p className="text-sm text-muted-foreground">
          Snap a photo or upload an image of your assignment
        </p>
      </div>

      {/* Main upload area */}
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
            ? 'border-primary/70 shadow-lg shadow-primary/10' 
            : previewUrl 
              ? 'border-primary/30' 
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

        <div className="p-8">
          {previewUrl ? (
            // Preview state
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
                      className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              {isProcessing && !isUploading && (
                <div className="flex items-center justify-center gap-3 text-primary">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Analyzing your homework...</span>
                </div>
              )}
            </div>
          ) : (
            // Empty state
            <div className="flex flex-col items-center gap-6 py-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "p-5 rounded-2xl transition-all duration-300",
                  isDragging ? "bg-primary/10" : "bg-secondary/80"
                )}
              >
                <Upload className={cn(
                  "w-10 h-10 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )} />
              </motion.div>

              <div className="space-y-2 text-center">
                <p className="text-base font-medium">
                  {isDragging ? 'Drop your image here' : 'Drag & drop your image'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports JPG, PNG, WEBP (Max 5MB)
                </p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef2.current?.click()}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2"
                  disabled={isLoading}
                >
                  <ImageIcon className="w-4 h-4" />
                  Choose Image
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCameraCapture}
                  className="px-6 py-2.5 rounded-xl border-2 border-border bg-card text-foreground font-medium hover:bg-accent transition-colors flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </motion.button>
              </div>
            </div>
          )}

          {/* Status indicators */}
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
            <div className="mt-4 flex items-center justify-center gap-3 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Processing...</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Features footer */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: CheckCircle2, label: 'AI Powered', color: 'text-primary' },
          { icon: CheckCircle2, label: 'Instant Analysis', color: 'text-secondary-foreground' },
          { icon: CheckCircle2, label: 'Secure Upload', color: 'text-muted-foreground' },
        ].map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
          >
            <feature.icon className={cn("w-3 h-3", feature.color)} />
            <span>{feature.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}