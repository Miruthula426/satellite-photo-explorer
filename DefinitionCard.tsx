import React, { useState } from 'react';
import { BookOpen, Volume2, VolumeX, Copy, Check, Info, Radio, Layers, Sparkles } from 'lucide-react';
import { AnalysisResult } from '../types';

interface DefinitionCardProps {
  analysis: AnalysisResult;
  onAskSuggestedQuestion: (q: string) => void;
}

export const DefinitionCard: React.FC<DefinitionCardProps> = ({
  analysis,
  onAskSuggestedQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'remote-sensing' | 'facts'>('details');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  // Audio Speech Synthesis for Definition
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${analysis.featureName} on ${analysis.celestialBody}. Definition: ${analysis.definition}. Details: ${analysis.inDepthDetail}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleCopyDefinition = async () => {
    try {
      await navigator.clipboard.writeText(
        `Feature: ${analysis.featureName} (${analysis.celestialBody})\nMission: ${analysis.satelliteMission}\n\nDefinition:\n${analysis.definition}\n\nIn-Depth Details:\n${analysis.inDepthDetail}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Title and Badges */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              {analysis.celestialBody}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              🛰️ {analysis.satelliteMission}
            </span>
          </div>
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-white tracking-tight">
            {analysis.featureName}
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleSpeech}
            title={isSpeaking ? 'Stop Audio Readout' : 'Listen to Definition'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isSpeaking
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isSpeaking ? 'Stop Reading' : 'Read Aloud'}</span>
          </button>

          <button
            onClick={handleCopyDefinition}
            title="Copy definition and details"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* DEFINITION CALLOUT BOX - High Priority Visual Anchor */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-indigo-950/30 border border-cyan-500/30 p-4 sm:p-5 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
        <div className="flex items-center gap-2 mb-2 text-cyan-400">
          <BookOpen className="w-4 h-4" />
          <h3 className="font-heading font-semibold text-xs uppercase tracking-wider">
            Scientific Definition
          </h3>
        </div>
        <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-normal">
          {analysis.definition}
        </p>
      </div>

      {/* Navigation Tabs for In-Depth Detail vs Remote Sensing vs Facts */}
      <div>
        <div className="flex border-b border-slate-800 space-x-4 mb-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeTab === 'details'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            In-Depth Details & Formation
          </button>
          <button
            onClick={() => setActiveTab('remote-sensing')}
            className={`pb-2.5 flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeTab === 'remote-sensing'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Satellite Imaging Tech
          </button>
          <button
            onClick={() => setActiveTab('facts')}
            className={`pb-2.5 flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeTab === 'facts'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Key Facts ({analysis.keyFacts?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p className="whitespace-pre-line">{analysis.inDepthDetail}</p>
          </div>
        )}

        {activeTab === 'remote-sensing' && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase">
              <Radio className="w-3.5 h-3.5" />
              Orbital Remote Sensing Analysis
            </div>
            <p className="leading-relaxed">{analysis.satelliteImagingDetails}</p>
          </div>
        )}

        {activeTab === 'facts' && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {analysis.keyFacts?.map((fact, index) => (
              <li
                key={index}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-300"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Suggested Follow-up Prompts */}
      {analysis.suggestedQuestions && analysis.suggestedQuestions.length > 0 && (
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Suggested Questions to Ask:
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => onAskSuggestedQuestion(q)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800/90 hover:bg-slate-700/90 text-cyan-200 hover:text-white border border-slate-700/60 hover:border-cyan-500/50 transition-all text-left flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
