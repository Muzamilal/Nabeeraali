import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Image as ImageIcon, X, Sparkles, AlertCircle,
  Camera, FileText, Loader2,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { PageContainer } from '@/components/PageContainer';
import { useAuth } from '@/lib/auth';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import type { QuizQuestion } from '@/types';

export function ScanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }
    setError('');
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleScan = async () => {
    if (!imageFile || !user) return;
    setError('');
    setScanning(true);

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('scan-images')
        .upload(fileName, imageFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('scan-images').getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/scan-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Scan failed (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const questions: QuizQuestion[] = data.questions;

      if (!questions || questions.length === 0) {
        throw new Error('No questions could be extracted from this image. Try a clearer photo.');
      }

      sessionStorage.setItem('scanned_questions', JSON.stringify(questions));
      sessionStorage.setItem('scan_image_url', imageUrl);
      navigate('/select-mode');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan image. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const resetImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setError('');
  };

  return (
    <PageContainer>
      <Navbar />
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold font-display">Scan Your Notes</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Upload an image of your textbook, notes, or question sheet. Our AI will extract questions automatically.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 p-4 rounded-xl bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm animate-shake">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!imagePreview ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 p-12 text-center animate-fade-in-up ${
              dragActive
                ? 'border-primary-500 bg-primary-500/5 scale-[1.01]'
                : 'border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-900/50'
            }`}
            style={{ animationDelay: '0.1s' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <Upload size={36} className="text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Drop your image here</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
                or click to browse. Supports PNG, JPG, and other image formats up to 10MB.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1.5"><Camera size={16} /> Take a photo</span>
                <span className="flex items-center gap-1.5"><FileText size={16} /> Textbook pages</span>
                <span className="flex items-center gap-1.5"><ImageIcon size={16} /> Question sheets</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <button
                onClick={resetImage}
                className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
              >
                <X size={20} />
              </button>
              <img src={imagePreview} alt="Uploaded preview" className="w-full max-h-[400px] object-contain" />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleScan}
                disabled={scanning}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {scanning ? (
                  <><Loader2 size={20} className="animate-spin" /> AI scanning your image...</>
                ) : (
                  <><Sparkles size={20} /> Scan with AI</>
                )}
              </button>
              <button
                onClick={resetImage}
                disabled={scanning}
                className="px-6 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
              >
                Choose another
              </button>
            </div>

            {scanning && (
              <div className="mt-6 p-5 rounded-2xl bg-primary-500/5 border border-primary-500/20 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                    <Sparkles size={20} className="text-primary-500 animate-pulse" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-primary-700 dark:text-primary-300">AI is analyzing your image</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Extracting text and generating questions...</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </PageContainer>
  );
}

