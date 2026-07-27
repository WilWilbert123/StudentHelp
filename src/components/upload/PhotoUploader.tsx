'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, Image, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  onUploadComplete: (imageUrl: string) => void;
  isProcessing: boolean;
}

export default function PhotoUploader({ onUploadComplete, isProcessing }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToApi = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload via API route (server-side, uses service role key)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload image');
      }

      console.log('Upload successful, URL:', result.imageUrl);
      onUploadComplete(result.imageUrl);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
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

  const isLoading = isProcessing || isUploading;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all',
          isDragging ? 'border-primary bg-primary/5' : 'border-border',
          isLoading && 'opacity-50 pointer-events-none'
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

        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-secondary">
            <Upload className="w-8 h-8 text-primary" />
          </div>

          <div>
            <p className="text-lg font-medium text-foreground">
              Snap or Upload Your Homework
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag & drop your image here, or use the buttons below
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              disabled={isLoading}
            >
              <Image className="w-4 h-4" />
              Choose Image
            </button>
            <button
              onClick={handleCameraCapture}
              className="px-6 py-2.5 rounded-xl border border-border bg-card text-foreground font-medium hover:bg-accent transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              <Camera className="w-4 h-4" />
              Camera
            </button>
          </div>

          {error && (
            <div className="w-full mt-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {isUploading && (
            <div className="flex items-center gap-3 text-primary mt-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading your image...</span>
            </div>
          )}

          {isProcessing && !isUploading && (
            <div className="flex items-center gap-3 text-primary mt-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing your homework...</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

