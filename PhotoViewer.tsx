import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Grid, Maximize2, Minimize2, MapPin, Sparkles } from 'lucide-react';

interface PhotoViewerProps {
  dataUrl: string;
  title: string;
  celestialBody?: string;
  mission?: string;
  onPointSelected?: (coords: { xPercent: number; yPercent: number }) => void;
  selectedPoint?: { xPercent: number; yPercent: number } | null;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  dataUrl,
  title,
  celestialBody,
  mission,
  onPointSelected,
  selectedPoint,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPercent = Math.round((x / rect.width) * 100);
    const yPercent = Math.round((y / rect.height) * 100);

    if (onPointSelected) {
      onPointSelected({ xPercent, yPercent });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[380px] sm:h-[480px] lg:h-[540px]'
      }`}
    >
      {/* Top Overlay Bar */}
      <div className="absolute top-0 inset-x-0 z-20 px-4 py-3 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2 pointer-events-auto">
          {celestialBody && (
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-800/60 backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              {celestialBody}
            </span>
          )}
          {mission && (
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900/80 text-slate-300 border border-slate-800 backdrop-blur-xs">
              {mission}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 bg-slate-900/90 border border-slate-800/90 rounded-xl p-1 backdrop-blur-md pointer-events-auto shadow-lg">
          <button
            id="viewer-zoom-in"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="viewer-zoom-out"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            id="viewer-reset"
            onClick={handleReset}
            title="Reset View"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-0.5" />
          <button
            id="viewer-grid-toggle"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Planetary Coordinate Grid"
            className={`p-1.5 rounded-lg transition-colors ${
              showGrid ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            id="viewer-fullscreen-toggle"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex-1 overflow-hidden flex items-center justify-center cursor-crosshair select-none bg-radial from-slate-900 to-slate-950"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative max-w-full max-h-full flex items-center justify-center"
        >
          <img
            src={dataUrl}
            alt={title}
            onClick={handleImageClick}
            className="max-h-[360px] sm:max-h-[460px] lg:max-h-[510px] w-auto object-contain rounded-lg shadow-2xl pointer-events-auto"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />

          {/* Coordinate Grid Overlay */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none rounded-lg border border-cyan-500/30"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(6, 182, 212, 0.15) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(6, 182, 212, 0.15) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            >
              {/* Telemetry Corner Accents */}
              <div className="absolute top-2 left-2 text-[10px] font-mono text-cyan-400/70">
                LAT: 18°24'N | LON: 77°30'E
              </div>
              <div className="absolute bottom-2 right-2 text-[10px] font-mono text-cyan-400/70">
                SCALE: 250m/px • SATELLITE NADIR
              </div>
            </div>
          )}

          {/* Selected Feature Pin */}
          {selectedPoint && (
            <div
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-full z-30"
              style={{
                left: `${selectedPoint.xPercent}%`,
                top: `${selectedPoint.yPercent}%`,
              }}
            >
              <div className="flex flex-col items-center">
                <div className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500 text-[10px] font-mono shadow-[0_0_10px_rgba(6,182,212,0.5)] whitespace-nowrap mb-0.5 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  Target Focus
                </div>
                <MapPin className="w-6 h-6 text-cyan-400 fill-cyan-500/20 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-bounce" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2 truncate">
          <span className="font-semibold text-slate-200 truncate">{title}</span>
          {scale > 1 && (
            <span className="text-[11px] text-cyan-400 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-800/50">
              {scale.toFixed(1)}x Zoom
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Click image to pin feature • Scroll/drag to pan
          </span>
        </div>
      </div>
    </div>
  );
};
