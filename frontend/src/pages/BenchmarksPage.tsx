import React, { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, ShieldCheck, Award, Layers } from 'lucide-react';
import { BenchmarkResult } from '../types';
import { fetchBenchmarkResults } from '../services/api';

export const BenchmarksPage: React.FC = () => {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchBenchmarkResults()
      .then((data) => setResults(data))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      
      {/* Page Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-900/60 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/50">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider font-mono">
              REMOTE SENSING BENCHMARK DASHBOARD
            </h2>
            <p className="text-xs text-slate-400">
              Evaluated performance metrics across standard benchmarks (RSVQA, VRSBench, CDVQA, ISRO CartoRISAT)
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">RSVQA Single-Image VQA</span>
          <p className="text-2xl font-bold font-mono text-cyan-300">84.6%</p>
          <p className="text-[10px] text-slate-500 font-mono">Overall Accuracy (Low Res)</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">VRSBench Visual Grounding</span>
          <p className="text-2xl font-bold font-mono text-teal-300">62.4%</p>
          <p className="text-[10px] text-slate-500 font-mono">Mean Intersection-over-Union (mIoU)</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">CDVQA Bi-Temporal Change</span>
          <p className="text-2xl font-bold font-mono text-cyan-300">79.2%</p>
          <p className="text-[10px] text-slate-500 font-mono">Change Detection F1-Score</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">ISRO Cartosat + RISAT</span>
          <p className="text-2xl font-bold font-mono text-emerald-300">88.1%</p>
          <p className="text-[10px] text-slate-500 font-mono">Optical + SAR Cross-Modal Fusion</p>
        </div>

      </div>

      {/* Benchmark Results Table */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
        
        <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider">
          BENCHMARK EVALUATION LOG MATRIX
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase text-[10px]">
                <th className="p-3">Benchmark Dataset</th>
                <th className="p-3">Task Category</th>
                <th className="p-3">Model Adapter</th>
                <th className="p-3">Target Metric</th>
                <th className="p-3">Evaluated Score</th>
                <th className="p-3">Evaluation Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {results.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-950/50 transition-colors">
                  <td className="p-3 font-semibold text-cyan-300">{row.dataset}</td>
                  <td className="p-3">{row.task}</td>
                  <td className="p-3 font-mono text-slate-400">{row.model}</td>
                  <td className="p-3 text-slate-400">{row.metric}</td>
                  <td className="p-3 font-bold text-emerald-400">{row.score}</td>
                  <td className="p-3 text-slate-500">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
