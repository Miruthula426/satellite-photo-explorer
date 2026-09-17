import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { PhotoViewer } from './components/PhotoViewer';
import { DefinitionCard } from './components/DefinitionCard';
import { QuestionPanel } from './components/QuestionPanel';
import { RecentScansBar } from './components/RecentScansBar';
import { PRESET_PHOTOS } from './data/presetPhotos';
import { ActivePhoto, AnalysisResult, QuestionAnswer } from './types';
import { urlToBase64 } from './utils/imageHelper';
import { Loader2, AlertTriangle, RefreshCw, Satellite, Sparkles } from 'lucide-react';

export default function App() {
  const [activePhoto, setActivePhoto] = useState<ActivePhoto | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [qaList, setQaList] = useState<QuestionAnswer[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ xPercent: number; yPercent: number } | null>(null);
  const [recentPhotos, setRecentPhotos] = useState<ActivePhoto[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<{
    type: 'analyze' | 'ask';
    dataUrl?: string;
    mimeType?: string;
    question?: string;
    title?: string;
  } | null>(null);

  const parseClientError = (err: any): string => {
    if (!err) return "An unexpected error occurred.";
    const raw = err.message || String(err);
    if (raw.includes("503") || raw.includes("high demand") || raw.includes("UNAVAILABLE")) {
      return "The planetary AI model is currently experiencing high demand. Automatic retry is enabled, or click Retry below.";
    }
    if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
      return "API rate limit reached. Please wait a few seconds and try again.";
    }
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed?.error?.message) return parsed.error.message;
        if (parsed?.error) return typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
      }
    } catch {
      // ignore
    }
    return raw;
  };

  // Load saved session if available
  useEffect(() => {
    const saved = localStorage.getItem('satellite_recent_scans');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentPhotos(parsed);
          // If the user previously had a photo in this session, keep it
          loadPhoto(parsed[0]);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    // Do not force-load a preset; start on the upload screen so user can give their photo
  }, []);

  const saveRecentPhoto = (photo: ActivePhoto) => {
    setRecentPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== photo.id);
      const updated = [photo, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('satellite_recent_scans', JSON.stringify(updated));
      } catch (e) {
        // LocalStorage quota safety
      }
      return updated;
    });
  };

  const loadDefaultPreset = async () => {
    try {
      setIsAnalyzing(true);
      const preset = PRESET_PHOTOS[0];
      const { dataUrl, mimeType } = await urlToBase64(preset.imageUrl);
      const photo: ActivePhoto = {
        id: preset.id,
        title: preset.title,
        sourceType: 'preset',
        dataUrl,
        mimeType,
        timestamp: Date.now(),
      };
      setActivePhoto(photo);
      saveRecentPhoto(photo);
      await analyzeImage(dataUrl, mimeType, undefined, preset.title);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to initialize default satellite photo');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadPhoto = async (photo: ActivePhoto) => {
    setActivePhoto(photo);
    setSelectedCoordinates(null);
    setQaList([]);
    setErrorMessage(null);
    await analyzeImage(photo.dataUrl, photo.mimeType, undefined, photo.title);
  };

  const analyzeImage = async (
    dataUrl: string,
    mimeType: string,
    userPrompt?: string,
    titleHint?: string
  ) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/analyze-satellite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: { data: dataUrl, mimeType },
          userPrompt: userPrompt || (titleHint ? `Subject hint: ${titleHint}` : undefined),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setAnalysisResult(data);

      // If user had an initial question, submit it right away
      if (userPrompt && userPrompt.trim()) {
        await handleAskQuestion(userPrompt.trim(), dataUrl, mimeType, data);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      const friendly = parseClientError(err);
      setErrorMessage(friendly);
      setLastFailedAction({
        type: 'analyze',
        dataUrl,
        mimeType,
        title: titleHint || activePhoto?.title,
        question: userPrompt,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageSelected = async (data: {
    dataUrl: string;
    mimeType: string;
    title: string;
    initialQuestion?: string;
  }) => {
    const photo: ActivePhoto = {
      id: `photo-${Date.now()}`,
      title: data.title,
      sourceType: 'upload',
      dataUrl: data.dataUrl,
      mimeType: data.mimeType,
      timestamp: Date.now(),
    };

    setActivePhoto(photo);
    saveRecentPhoto(photo);
    setSelectedCoordinates(null);
    setQaList([]);
    setShowUploadModal(false);

    await analyzeImage(data.dataUrl, data.mimeType, data.initialQuestion, data.title);
  };

  const handleAskQuestion = async (
    question: string,
    customDataUrl?: string,
    customMime?: string,
    customAnalysis?: AnalysisResult
  ) => {
    const imgData = customDataUrl || activePhoto?.dataUrl;
    const imgMime = customMime || activePhoto?.mimeType;
    const currentAnalysis = customAnalysis || analysisResult;

    if (!imgData || !imgMime) {
      setErrorMessage('No active satellite photo to analyze.');
      return;
    }

    setIsAsking(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/ask-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: { data: imgData, mimeType: imgMime },
          question,
          featureContext: currentAnalysis
            ? {
                celestialBody: currentAnalysis.celestialBody,
                featureName: currentAnalysis.featureName,
                satelliteMission: currentAnalysis.satelliteMission,
              }
            : undefined,
          history: qaList.map((qa) => ({ role: 'user', text: qa.question })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const result = await response.json();
      const newQA: QuestionAnswer = {
        id: `qa-${Date.now()}`,
        question,
        definition: result.definition || 'No definition available.',
        detailedExplanation: result.detailedExplanation || '',
        satelliteContext: result.satelliteContext || '',
        followUpQuestions: result.followUpQuestions || [],
        timestamp: Date.now(),
      };

      setQaList((prev) => [...prev, newQA]);
      setLastFailedAction(null);
    } catch (err: any) {
      console.error('Q&A error:', err);
      const friendly = parseClientError(err);
      setErrorMessage(friendly);
      setLastFailedAction({
        type: 'ask',
        question,
      });
    } finally {
      setIsAsking(false);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem('satellite_recent_scans');
    setRecentPhotos([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Navigation Header */}
      <Header
        onOpenUpload={() => setShowUploadModal(true)}
        hasActivePhoto={!!activePhoto}
        activeTitle={activePhoto?.title}
        onSelectPresetsModal={() => setShowUploadModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Recent Scans Strip */}
        {recentPhotos.length > 1 && activePhoto && (
          <RecentScansBar
            recentPhotos={recentPhotos}
            activeId={activePhoto.id}
            onSelectPhoto={loadPhoto}
            onClearHistory={handleClearHistory}
          />
        )}

        {/* Global Error Banner with Retry */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800/90 text-sm text-red-200 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fade-in">
            <div className="flex items-start gap-2.5 max-w-2xl">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">System Notice</p>
                <p className="text-xs text-red-300/90 mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {lastFailedAction && (
                <button
                  onClick={() => {
                    if (lastFailedAction.type === 'analyze' && lastFailedAction.dataUrl && lastFailedAction.mimeType) {
                      analyzeImage(
                        lastFailedAction.dataUrl,
                        lastFailedAction.mimeType,
                        lastFailedAction.question,
                        lastFailedAction.title
                      );
                    } else if (lastFailedAction.type === 'ask' && lastFailedAction.question) {
                      handleAskQuestion(lastFailedAction.question);
                    }
                  }}
                  disabled={isAnalyzing || isAsking}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry {lastFailedAction.type === 'analyze' ? 'Analysis' : 'Question'}</span>
                </button>
              )}
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setLastFailedAction(null);
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Workflow Steps Indicator */}
        {activePhoto && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/80 flex items-center justify-center text-[10px] text-cyan-400">
                  1
                </span>
                <span>Photo Given: <span className="text-white font-bold">{activePhoto.title}</span></span>
              </div>
              <span className="text-slate-600 hidden sm:inline">→</span>
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/80 flex items-center justify-center text-[10px] text-cyan-400">
                  2
                </span>
                <span>{isAnalyzing ? "AI Analyzing Photo..." : "Photo Analyzed & Defined"}</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">→</span>
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400">
                  3
                </span>
                <span>Ask Questions Based on Image</span>
              </div>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer font-medium ml-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Change / Give Another Photo</span>
            </button>
          </div>
        )}

        {/* If no photo loaded, show initial uploader */}
        {!activePhoto && (
          <div className="max-w-3xl mx-auto py-6">
            <div className="text-center mb-6 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shadow-sm">
                <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                Step 1: Give Your Satellite Photo
              </div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">
                Upload or Provide a Satellite Photo
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                Provide any photo taken in the solar system by a satellite or space probe. AI will analyze the image, give a formal scientific definition of what's captured, and answer all your questions directly based on the photograph.
              </p>
            </div>
            <ImageUploader
              onImageSelected={handleImageSelected}
              isLoading={isAnalyzing}
            />
          </div>
        )}

        {/* Active Photo Workspace */}
        {activePhoto && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Image Viewer & Primary Definition Card */}
            <div className="lg:col-span-7 space-y-6">
              {/* Interactive Image Viewer */}
              <div className="relative">
                <PhotoViewer
                  dataUrl={activePhoto.dataUrl}
                  title={activePhoto.title}
                  celestialBody={analysisResult?.celestialBody}
                  mission={analysisResult?.satelliteMission}
                  onPointSelected={setSelectedCoordinates}
                  selectedPoint={selectedCoordinates}
                />

                {isAnalyzing && (
                  <div className="absolute inset-0 z-30 rounded-2xl bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6">
                    <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center mb-3">
                      <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Analyzing Satellite Photograph
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Consulting Gemini vision telemetry for celestial body identification, geologic features, and scientific definition...
                    </p>
                  </div>
                )}
              </div>

              {/* Primary Definition & Breakdown Card */}
              {analysisResult && (
                <DefinitionCard
                  analysis={analysisResult}
                  onAskSuggestedQuestion={(q) => handleAskQuestion(q)}
                />
              )}
            </div>

            {/* Right Column: Interactive Q&A Assistant */}
            <div className="lg:col-span-5 space-y-6">
              <QuestionPanel
                qaList={qaList}
                onAskQuestion={(q) => handleAskQuestion(q)}
                isAsking={isAsking}
                activeFeatureName={analysisResult?.featureName}
                selectedCoordinates={selectedCoordinates}
                onClearCoordinates={() => setSelectedCoordinates(null)}
                lastFailedQuestion={lastFailedAction?.type === 'ask' ? lastFailedAction.question : null}
                onRetryLastQuestion={() => {
                  if (lastFailedAction?.question) {
                    handleAskQuestion(lastFailedAction.question);
                  }
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Upload / Presets Modal */}
      {showUploadModal && (
        <ImageUploader
          showAsModal
          onClose={() => setShowUploadModal(false)}
          onImageSelected={handleImageSelected}
          isLoading={isAnalyzing}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-cyan-400" />
            <span>Solar System Satellite Observation & Scientific Definition Engine</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Powered by Google Gemini 3.8 Flash Multimodal Intelligence
          </p>
        </div>
      </footer>
    </div>
  );
}
