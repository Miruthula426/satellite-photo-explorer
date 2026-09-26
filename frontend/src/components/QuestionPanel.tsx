import React from 'react';
import { Send, Sparkles, HelpCircle, Loader2 } from 'lucide-react';
import { AnalysisMode } from '../types';

interface QuestionPanelProps {
  query: string;
  setQuery: (q: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  mode: AnalysisMode;
  presetQueries: string[];
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({
  query,
  setQuery,
  onSubmit,
  isLoading,
  mode,
  presetQueries,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (query.trim() && !isLoading) {
        onSubmit();
      }
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
      
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          NATURAL LANGUAGE SATELLITE QUERY
        </label>
        <span className="text-[11px] text-slate-400 font-mono">Agent Task Auto-Routing Enabled</span>
      </div>

      {/* Input query text box */}
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask SatQuery anything about the satellite imagery (e.g. 'Describe the land cover', 'Highlight water body', 'What changed between these dates?')..."
          rows={3}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 resize-none font-sans"
        />

        <button
          onClick={onSubmit}
          disabled={!query.trim() || isLoading}
          className="absolute right-3 bottom-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-mono bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-md shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Executing Pipeline...
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              Execute Analysis
            </>
          )}
        </button>
      </div>

      {/* Suggested queries */}
      {presetQueries.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3 h-3 text-cyan-400" />
            Suggested RS Queries for current mode:
          </p>

          <div className="flex flex-wrap gap-2">
            {presetQueries.map((pq, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(pq)}
                className="text-xs bg-slate-950 hover:bg-slate-800/80 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/40 transition-all text-left"
              >
                "{pq}"
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
