import React from 'react';
import { History, Trash2, ArrowRight } from 'lucide-react';
import { ActivePhoto } from '../types';

interface RecentScansBarProps {
  recentPhotos: ActivePhoto[];
  activeId: string;
  onSelectPhoto: (photo: ActivePhoto) => void;
  onClearHistory: () => void;
}

export const RecentScansBar: React.FC<RecentScansBarProps> = ({
  recentPhotos,
  activeId,
  onSelectPhoto,
  onClearHistory,
}) => {
  if (recentPhotos.length <= 1) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 overflow-x-auto text-xs">
      <div className="flex items-center space-x-2 shrink-0 text-slate-400">
        <History className="w-4 h-4 text-cyan-400" />
        <span className="font-semibold text-slate-300">Recent Scans:</span>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto py-1">
        {recentPhotos.map((photo) => {
          const isActive = photo.id === activeId;
          return (
            <button
              key={photo.id}
              onClick={() => onSelectPhoto(photo)}
              className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
            >
              <img
                src={photo.dataUrl}
                alt={photo.title}
                className="w-5 h-5 rounded object-cover border border-slate-700"
              />
              <span className="max-w-[120px] truncate font-medium">{photo.title}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onClearHistory}
        title="Clear Recent Scans"
        className="text-slate-500 hover:text-red-400 p-1 rounded-md transition-colors shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
