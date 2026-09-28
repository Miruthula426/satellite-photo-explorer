import React, { useState } from 'react';
import { CheckCircle2, Download, ShieldCheck, Cpu, FileSpreadsheet, Loader2, Globe, Eye } from 'lucide-react';
import { AnalysisResponse } from '../types';
import { MetadataInspectorModal } from './MetadataInspectorModal';
import { ReportPreviewModal } from './ReportPreviewModal';

interface AnalysisResultCardProps {
  response: AnalysisResponse;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({ response }) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await fetch(`${API_BASE}/reports/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      });
      if (!res.ok) throw new Error('PDF export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `satquery_report_${response.id}.pdf`;
      a.click();
    } catch (err) {
      console.error('PDF Download Error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadJson = async () => {
    try {
      setIsExportingJson(true);
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await fetch(`${API_BASE}/reports/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      });
      if (!res.ok) throw new Error('JSON export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `satquery_report_${response.id}.json`;
      a.click();
    } catch (err) {
      console.error('JSON Download Error:', err);
    } finally {
      setIsExportingJson(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
      
      {/* Header Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800">
            TASK: {response.task.toUpperCase()}
          </span>
          
          <span className="font-mono text-xs text-slate-400">
            ID: <span className="text-slate-200">{response.id}</span>
          </span>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Confidence:</span>
            <span className="text-cyan-300 font-bold">
              {response.confidence !== null ? `${Math.round(response.confidence * 100)}%` : response.confidence_label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">Latency:</span>
            <span className="text-teal-300 font-bold">{response.execution_time_ms} ms</span>
          </div>
        </div>

      </div>

      {/* Primary Agent Answer Content */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
          AGENT ANALYSIS SYNTHESIS & ANSWER
        </h4>
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 leading-relaxed font-sans shadow-inner">
          {response.answer}
        </div>
      </div>

      {/* Specialist Model Badges & Download Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        
        {/* Model Badges */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-slate-400">Models:</span>
          {response.models.map((m, idx) => (
            <span key={idx} className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
              {m}
            </span>
          ))}
        </div>

        {/* Actions: Metadata & Download */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsMetadataOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-950 hover:bg-slate-800 text-teal-300 border border-teal-800/60 transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            Inspect Geospatial Metadata
          </button>

          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            Preview Formal Report
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-sm shadow-cyan-900/30 transition-all"
          >
            {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export PDF Report
          </button>

          <button
            onClick={handleDownloadJson}
            disabled={isExportingJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
          >
            {isExportingJson ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            Export JSON
          </button>
        </div>

      </div>

      {/* Geospatial Metadata Inspector Modal */}
      <MetadataInspectorModal
        isOpen={isMetadataOpen}
        onClose={() => setIsMetadataOpen(false)}
        metadata={(response.metadata as any) || null}
        filename={response.metadata?.filename}
      />

      {/* Formal Analysis Report Preview Modal */}
      <ReportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        response={response}
        onDownloadPdf={handleDownloadPdf}
        onDownloadJson={handleDownloadJson}
        isExportingPdf={isExportingPdf}
        isExportingJson={isExportingJson}
      />

    </div>
  );
};
