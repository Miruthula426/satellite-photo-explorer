import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, BookOpen, Radio, Volume2, VolumeX, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { QuestionAnswer } from '../types';

interface QuestionPanelProps {
  qaList: QuestionAnswer[];
  onAskQuestion: (question: string) => Promise<void>;
  isAsking: boolean;
  activeFeatureName?: string;
  selectedCoordinates?: { xPercent: number; yPercent: number } | null;
  onClearCoordinates?: () => void;
  lastFailedQuestion?: string | null;
  onRetryLastQuestion?: () => void;
}

const DEFAULT_QUICK_QUESTIONS = [
  'What is the precise definition of the primary feature in this photo?',
  'How was this geological/atmospheric formation created?',
  'What satellite instruments or spectral bands captured this view?',
  'What is the physical size, scale, and elevation of this structure?',
  'Is there evidence of water, ice, or volatile compounds here?',
  'How does this compare to similar features found on Earth?',
];

export const QuestionPanel: React.FC<QuestionPanelProps> = ({
  qaList,
  onAskQuestion,
  isAsking,
  activeFeatureName,
  selectedCoordinates,
  onClearCoordinates,
  lastFailedQuestion,
  onRetryLastQuestion,
}) => {
  const [questionInput, setQuestionInput] = useState('');
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-fill prompt when user clicks a coordinate on the image
  useEffect(() => {
    if (selectedCoordinates) {
      setQuestionInput(
        `What is the definition and detail of the feature located at coordinate area X:${selectedCoordinates.xPercent}%, Y:${selectedCoordinates.yPercent}% in this satellite photo?`
      );
    }
  }, [selectedCoordinates]);

  // Scroll to new answer
  useEffect(() => {
    if (qaList.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [qaList, isAsking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || isAsking) return;
    const q = questionInput.trim();
    setQuestionInput('');
    if (onClearCoordinates) onClearCoordinates();
    try {
      await onAskQuestion(q);
    } catch {
      setQuestionInput(q);
    }
  };

  const handleQuickQuestionClick = async (q: string) => {
    if (isAsking) return;
    await onAskQuestion(q);
  };

  const handleSpeech = (qa: QuestionAnswer) => {
    if (!('speechSynthesis' in window)) return;

    if (activeSpeechId === qa.id) {
      window.speechSynthesis.cancel();
      setActiveSpeechId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = `Question: ${qa.question}. Definition: ${qa.definition}. Detailed Explanation: ${qa.detailedExplanation.replace(/[#*_`]/g, '')}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.onend = () => setActiveSpeechId(null);
    utterance.onerror = () => setActiveSpeechId(null);

    window.speechSynthesis.speak(utterance);
    setActiveSpeechId(qa.id);
  };

  const handleCopy = async (qa: QuestionAnswer) => {
    try {
      const fullText = `Q: ${qa.question}\n\nDEFINITION:\n${qa.definition}\n\nDETAILED EXPLANATION:\n${qa.detailedExplanation}\n\nSATELLITE REMOTE SENSING:\n${qa.satelliteContext}`;
      await navigator.clipboard.writeText(fullText);
      setCopiedId(qa.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h3 className="font-heading font-bold text-lg text-white">
            Ask Questions About This Satellite Photo
          </h3>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
          Powered by Gemini Vision
        </span>
      </div>

      {/* Quick Questions Chips */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Popular Satellite Inquiries
        </div>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestionClick(q)}
              disabled={isAsking}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all text-left disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Coordinates Pin Alert */}
      {selectedCoordinates && (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>
              Target coordinate pinned on image: <strong>X: {selectedCoordinates.xPercent}%, Y: {selectedCoordinates.yPercent}%</strong>
            </span>
          </div>
          {onClearCoordinates && (
            <button
              onClick={onClearCoordinates}
              className="text-[11px] underline text-cyan-400 hover:text-cyan-200"
            >
              Clear Pin
            </button>
          )}
        </div>
      )}

      {/* QA Thread / Conversation History */}
      <div className="space-y-5 max-h-[520px] overflow-y-auto pr-1">
        {qaList.length === 0 && !isAsking && (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/30">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">
              Ask anything about what is shown in this satellite photo!
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Get formal definitions of craters, tectonic rifts, cloud bands, albedo features, or atmospheric dynamics, along with detailed remote sensing analysis.
            </p>
          </div>
        )}

        {qaList.map((qa) => (
          <div
            key={qa.id}
            className="rounded-xl bg-slate-950/70 border border-slate-800/90 p-4 sm:p-5 space-y-4 shadow-sm"
          >
            {/* User Question */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[11px] font-bold text-cyan-400 shrink-0 mt-0.5">
                  Q
                </span>
                <h4 className="font-heading font-semibold text-sm sm:text-base text-slate-100">
                  {qa.question}
                </h4>
              </div>

              {/* Utility actions */}
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => handleSpeech(qa)}
                  title={activeSpeechId === qa.id ? 'Stop Speech' : 'Read Aloud'}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    activeSpeechId === qa.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {activeSpeechId === qa.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleCopy(qa)}
                  title="Copy QA"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  {copiedId === qa.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Scientific Definition Callout */}
            <div className="rounded-lg bg-cyan-950/30 border border-cyan-500/30 p-3.5">
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                Definition
              </div>
              <p className="text-sm text-cyan-50 font-medium leading-relaxed">
                {qa.definition}
              </p>
            </div>

            {/* Detailed Explanation */}
            <div className="text-sm text-slate-300 leading-relaxed space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Detailed Analysis:
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed">
                <ReactMarkdown>{qa.detailedExplanation}</ReactMarkdown>
              </div>
            </div>

            {/* Satellite Remote Sensing Insight */}
            {qa.satelliteContext && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                <Radio className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200">Satellite Sensor Observation: </span>
                  <span>{qa.satelliteContext}</span>
                </div>
              </div>
            )}

            {/* Follow-up Suggestions */}
            {qa.followUpQuestions && qa.followUpQuestions.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                  Follow-up queries:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {qa.followUpQuestions.map((fq, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuestionClick(fq)}
                      disabled={isAsking}
                      className="px-2.5 py-1 rounded-md text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/30 transition-all text-left"
                    >
                      {fq}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading placeholder */}
        {isAsking && (
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-5 flex items-center space-x-3 text-slate-400">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Analyzing satellite telemetry & visual data...
              </p>
              <p className="text-xs text-slate-500">
                Synthesizing scientific definition and detailed explanation
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Last Failed Question Quick-Retry Banner */}
      {lastFailedQuestion && !isAsking && (
        <div className="mb-2 px-3 py-2 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-between gap-2 text-xs text-red-200">
          <span className="truncate">Previous question failed to complete: <strong className="text-white">"{lastFailedQuestion}"</strong></span>
          <button
            type="button"
            onClick={() => onRetryLastQuestion ? onRetryLastQuestion() : onAskQuestion(lastFailedQuestion)}
            className="px-2.5 py-1 rounded-lg bg-red-800 hover:bg-red-700 text-white font-medium shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry Question</span>
          </button>
        </div>
      )}

      {/* Question Input Form */}
      <form onSubmit={handleSubmit} className="relative pt-2">
        <div className="flex items-center gap-2">
          <input
            id="satellite-question-input"
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            disabled={isAsking}
            placeholder={
              activeFeatureName
                ? `Ask a question about ${activeFeatureName} (e.g., definition, origin, satellite sensors)...`
                : "Ask anything about this satellite photograph..."
            }
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 transition-all"
          />
          <button
            id="submit-satellite-question-btn"
            type="submit"
            disabled={!questionInput.trim() || isAsking}
            className="px-5 py-3 rounded-xl font-semibold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.2)]"
          >
            {isAsking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
