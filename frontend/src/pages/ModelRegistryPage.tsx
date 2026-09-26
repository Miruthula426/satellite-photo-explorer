import React from 'react';
import { Cpu, CheckCircle2, Layers, ShieldCheck, Zap } from 'lucide-react';

export const ModelRegistryPage: React.FC = () => {
  const models = [
    {
      name: 'SatQueryVQA-RSAdapter',
      task: 'Single-Image VQA',
      type: 'Vision-Language Adapter',
      modality: 'OPTICAL / MULTISPECTRAL',
      description: 'Specialist remote sensing VQA model trained to answer direct natural language queries regarding land cover, water bodies, and infrastructure.'
    },
    {
      name: 'SatCaptioner-ViT-RS',
      task: 'Remote Sensing Captioning',
      type: 'ViT + Text Decoder Adapter',
      modality: 'OPTICAL / MULTISPECTRAL',
      description: 'Generates comprehensive textbook-grade scientific descriptions of satellite raster scenes including spatial scale and CRS context.'
    },
    {
      name: 'SatGrounder-Segmenter',
      task: 'Visual Grounding & Segmentation',
      type: 'Segmenter & Bounding Box Extractor',
      modality: 'OPTICAL / MULTISPECTRAL',
      description: 'Localizes requested land cover targets (water, vegetation, built-up) and outputs pixel-level binary masks and bounding box overlays.'
    },
    {
      name: 'SatChangeDetector-BiTemporal',
      task: 'Bi-Temporal Change Detection',
      type: 'Difference & Cluster Analyzer',
      modality: 'BI-TEMPORAL OPTICAL / SAR',
      description: 'Performs pixel-level spectral difference calculations, spatial alignment, change mask generation, and area percentage quantification.'
    },
    {
      name: 'SatChangeVQA-RSNet',
      task: 'Bi-Temporal Change VQA',
      type: 'Change VQA Specialist',
      modality: 'BI-TEMPORAL OPTICAL / SAR',
      description: 'Combines ChangeDetector evidence with natural language reasoning to answer complex change queries ("What changed?", "Has built-up increased?").'
    },
    {
      name: 'SatFusionNet-OpticalSAR',
      task: 'Optical + SAR Joint Fusion',
      type: 'Cross-Modal Fusion Adapter',
      modality: 'OPTICAL + SAR DUAL MODALITY',
      description: 'Fuses Optical spectral reflectance with SAR microwave backscatter intensity for cloud-penetrating water and urban structure extraction.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      
      {/* Page Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-900/60 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/50">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider font-mono">
              SATQUERY SPECIALIST MODEL REGISTRY
            </h2>
            <p className="text-xs text-slate-400">
              Decoupled Model Adapters providing specialist inference for remote sensing tasks
            </p>
          </div>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((m, idx) => (
          <div key={idx} className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/50 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                  {m.task}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{m.modality}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold font-mono text-slate-100">{m.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{m.type}</p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">{m.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Status:</span>
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active / Lazy Loaded
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
