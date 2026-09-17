import React from 'react';
import { Satellite, Orbit, Sparkles, Upload, Compass } from 'lucide-react';

interface HeaderProps {
  onOpenUpload: () => void;
  hasActivePhoto: boolean;
  activeTitle?: string;
  onSelectPresetsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  hasActivePhoto,
  activeTitle,
  onSelectPresetsModal,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Satellite className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-heading font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                Satellite Photo Explorer
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                <Orbit className="w-3 h-3 mr-1 text-cyan-400" />
                Solar System
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Planetary Remote Sensing, Satellite Feature Definitions & Scientific Q&A
            </p>
          </div>
        </div>

        {/* Center / Active Info */}
        {hasActivePhoto && activeTitle && (
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 max-w-xs truncate">
            <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate font-medium">{activeTitle}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            id="header-presets-btn"
            onClick={onSelectPresetsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Explore Presets</span>
            <span className="sm:hidden">Presets</span>
          </button>

          <button
            id="header-upload-btn"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 transition-all shadow-[0_0_12px_rgba(34,211,238,0.25)] cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
