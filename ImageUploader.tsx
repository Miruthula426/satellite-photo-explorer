import React, { useState, useRef, useEffect } from 'react';
import { Upload, Link as LinkIcon, Sparkles, Image as ImageIcon, AlertCircle, Loader2, X } from 'lucide-react';
import { PRESET_PHOTOS } from '../data/presetPhotos';
import { PresetSatellitePhoto } from '../types';
import { fileToBase64, urlToBase64 } from '../utils/imageHelper';

interface ImageUploaderProps {
  onImageSelected: (data: { dataUrl: string; mimeType: string; title: string; initialQuestion?: string }) => void;
  isLoading: boolean;
  onClose?: () => void;
  showAsModal?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  isLoading,
  onClose,
  showAsModal = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [initialQuestion, setInitialQuestion] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processingFile, setProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileUpload(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [initialQuestion]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }
    try {
      setProcessingFile(true);
      const { dataUrl, mimeType } = await fileToBase64(file);
      onImageSelected({
        dataUrl,
        mimeType,
        title: file.name.replace(/\.[^/.]+$/, ''),
        initialQuestion: initialQuestion.trim() || undefined,
      });
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process image file');
    } finally {
      setProcessingFile(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setErrorMsg(null);
    try {
      setProcessingFile(true);
      const { dataUrl, mimeType } = await urlToBase64(urlInput.trim());
      onImageSelected({
        dataUrl,
        mimeType,
        title: 'Satellite Photo from URL',
        initialQuestion: initialQuestion.trim() || undefined,
      });
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load image from URL. Check CORS or download the image first.');
    } finally {
      setProcessingFile(false);
    }
  };

  const handleSelectPreset = async (preset: PresetSatellitePhoto) => {
    setErrorMsg(null);
    try {
      setProcessingFile(true);
      const { dataUrl, mimeType } = await urlToBase64(preset.imageUrl);
      onImageSelected({
        dataUrl,
        mimeType,
        title: preset.title,
        initialQuestion: initialQuestion.trim() || undefined,
      });
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMsg(`Could not load preset photo: ${err.message}`);
    } finally {
      setProcessingFile(false);
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Optional Initial Question */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Question or Focus (Optional)
        </label>
        <input
          type="text"
          value={initialQuestion}
          onChange={(e) => setInitialQuestion(e.target.value)}
          placeholder="e.g. What is the definition of this crater? How was this river delta formed?"
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/70 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
        />
        <p className="text-[11px] text-slate-500 mt-1">
          Leave blank to automatically identify the celestial body, define visible structures, and provide key facts.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
            : 'border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-900/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="mx-auto w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
          {processingFile || isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        <p className="text-sm font-semibold text-slate-200 mb-1">
          {processingFile ? 'Processing satellite photo...' : 'Drop your satellite photo here, or click to browse'}
        </p>
        <p className="text-xs text-slate-400">
          Supports high-res PNG, JPG, WebP. You can also paste from clipboard (Ctrl+V).
        </p>
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleUrlSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Or enter image URL (https://...)"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/70 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={!urlInput.trim() || processingFile || isLoading}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-50 border border-slate-700 transition-colors"
        >
          Load URL
        </button>
      </form>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/50 text-xs text-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Curated Presets Grid */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Solar System Preset Photos
          </span>
          <span className="text-[11px] text-slate-500">1-click to test immediately</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PRESET_PHOTOS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              disabled={processingFile || isLoading}
              className="group text-left rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 p-2.5 transition-all flex flex-col cursor-pointer overflow-hidden shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-slate-950 border border-slate-800">
                <img
                  src={preset.thumbnailUrl}
                  alt={preset.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-xs text-[10px] font-medium text-cyan-300 border border-slate-700/60">
                  {preset.celestialBody}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-cyan-300 transition-colors">
                {preset.title}
              </h4>
              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                {preset.mission}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl my-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              <h3 className="font-heading font-bold text-lg text-white">Select Solar System Satellite Photo</h3>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center space-x-2 pb-4 border-b border-slate-800/80 mb-5">
        <ImageIcon className="w-5 h-5 text-cyan-400" />
        <h3 className="font-heading font-bold text-lg text-white">Load Satellite Photo</h3>
      </div>
      {content}
    </div>
  );
};
