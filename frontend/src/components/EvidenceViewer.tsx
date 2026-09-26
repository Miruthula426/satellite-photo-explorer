import React, { useState } from 'react';
import { Layers, ZoomIn, ZoomOut, Eye, Split, EyeOff, Sliders } from 'lucide-react';
import { VisualEvidence, BoundingBox } from '../types';

interface EvidenceViewerProps {
  evidenceList: VisualEvidence[];
  primaryImageUrl?: string;
  secondaryImageUrl?: string;
  mode: string;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  evidenceList,
  primaryImageUrl,
  secondaryImageUrl,
  mode,
}) => {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>(
    evidenceList.length > 0 ? evidenceList[0].id : 'original'
  );
  const [opacity, setOpacity] = useState<number>(0.75);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isSplitView, setIsSplitView] = useState<boolean>(mode !== 'single');

  const selectedEvidence = evidenceList.find((e) => e.id === selectedEvidenceId) || evidenceList[0];

  const currentDisplayImage = selectedEvidence?.data_base64 || selectedEvidence?.artifact_url || primaryImageUrl;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
      
      {/* Evidence Toolbar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/50">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
              VISUAL EVIDENCE VIEWER
            </h3>
            <p className="text-xs text-slate-400">Interactive Remote Sensing Artifact & Layer Explorer</p>
          </div>
        </div>

        {/* Layer Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {evidenceList.map((ev) => (
            <button
              key={ev.id}
              onClick={() => setSelectedEvidenceId(ev.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                selectedEvidenceId === ev.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ev.title}
            </button>
          ))}
        </div>
      </div>

      {/* Control Bar: Zoom, Opacity, Split Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-xs">
        
        {/* Opacity Control */}
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-300 font-mono">Overlay Opacity:</span>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-24 accent-cyan-400 cursor-pointer"
          />
          <span className="font-mono text-cyan-400 text-[11px]">{Math.round(opacity * 100)}%</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
            className="p-1 rounded bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-slate-300 min-w-[45px] text-center">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
            className="p-1 rounded bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Split View Toggle */}
        {mode !== 'single' && secondaryImageUrl && (
          <button
            onClick={() => setIsSplitView(!isSplitView)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-xs transition-all ${
              isSplitView
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            {isSplitView ? 'Side-by-Side: ON' : 'Single View'}
          </button>
        )}
      </div>

      {/* Main Image Canvas View */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[360px] flex items-center justify-center p-2">
        
        {isSplitView && secondaryImageUrl ? (
          /* Dual Side-by-Side Comparison Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full h-full">
            
            {/* Left Frame: Earlier / Optical */}
            <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex flex-col">
              <div className="bg-slate-950/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
                <span>{mode === 'bitemporal' ? 'BEFORE (Time T1)' : 'OPTICAL REFLECTANCE'}</span>
              </div>
              <div className="p-2 flex items-center justify-center flex-1 overflow-auto">
                <img
                  src={primaryImageUrl}
                  alt="Primary scene"
                  className="max-h-[380px] object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              </div>
            </div>

            {/* Right Frame: Later / SAR / Evidence Layer */}
            <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex flex-col">
              <div className="bg-slate-950/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
                <span>
                  {selectedEvidence ? selectedEvidence.title : (mode === 'bitemporal' ? 'AFTER (Time T2)' : 'SAR / FUSED EVIDENCE')}
                </span>
              </div>
              <div className="p-2 flex items-center justify-center flex-1 overflow-auto">
                <img
                  src={currentDisplayImage}
                  alt="Evidence artifact"
                  className="max-h-[380px] object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})`, opacity: opacity }}
                />
              </div>
            </div>

          </div>
        ) : (
          /* Single Image Canvas View */
          <div className="relative max-w-full overflow-auto flex items-center justify-center">
            {currentDisplayImage ? (
              <img
                src={currentDisplayImage}
                alt={selectedEvidence?.title || 'Satellite Evidence'}
                className="max-h-[440px] rounded-lg object-contain transition-transform duration-200 shadow-2xl"
                style={{ transform: `scale(${zoomLevel})`, opacity: opacity }}
              />
            ) : (
              <p className="text-xs text-slate-500 font-mono">No visual evidence layer selected.</p>
            )}
          </div>
        )}

      </div>

      {/* Evidence Stats Panel */}
      {selectedEvidence?.statistics && Object.keys(selectedEvidence.statistics).length > 0 && (
        <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800 space-y-1.5">
          <p className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
            DERIVED GEOSPATIAL STATISTICS ({selectedEvidence.title})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {Object.entries(selectedEvidence.statistics).map(([k, v]) => (
              <div key={k} className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block truncate">{k.replace(/_/g, ' ')}</span>
                <span className="text-slate-100 font-bold">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
