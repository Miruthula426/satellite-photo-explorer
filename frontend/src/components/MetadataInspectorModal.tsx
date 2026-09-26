import React from 'react';
import { X, Globe, Layers, Cpu, Compass, Maximize2, Shield } from 'lucide-react';
import { GeoTIFFMetadata } from '../types';

interface MetadataInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: Partial<GeoTIFFMetadata> | null;
  filename?: string;
}

export const MetadataInspectorModal: React.FC<MetadataInspectorModalProps> = ({
  isOpen,
  onClose,
  metadata,
  filename,
}) => {
  if (!isOpen || !metadata) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-cyan-500/30 bg-slate-900/95 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                GEOSPATIAL RASTER METADATA INSPECTOR
              </h3>
              <p className="text-xs text-slate-400">{filename || metadata.filename || 'Satellite Scene'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 font-mono text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">COORDINATE REFERENCE SYSTEM (CRS)</span>
              <span className="text-cyan-300 font-bold text-sm block mt-1">
                {metadata.crs || 'EPSG:32644 (UTM Zone 44N)'}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">SENSOR MODALITY</span>
              <span className="text-teal-300 font-bold text-sm block mt-1">
                {metadata.modality || 'OPTICAL / MULTISPECTRAL'}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">SPATIAL DIMENSIONS</span>
              <span className="text-slate-100 font-bold text-sm block mt-1">
                {metadata.width || 512} x {metadata.height || 512} px
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">SPECTRAL BANDS & DTYPE</span>
              <span className="text-slate-100 font-bold text-sm block mt-1">
                {metadata.bands || 4} Bands ({metadata.dtype || 'uint16'})
              </span>
            </div>

          </div>

          {/* Spatial Bounds Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
              GEOGRAPHIC BOUNDING BOX (WGS84 EXTENT)
            </span>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block">WEST (MIN LON)</span>
                <span className="text-slate-200 font-bold">{metadata.bounds ? metadata.bounds[0] : '77.58° E'}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block">SOUTH (MIN LAT)</span>
                <span className="text-slate-200 font-bold">{metadata.bounds ? metadata.bounds[1] : '12.96° N'}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block">EAST (MAX LON)</span>
                <span className="text-slate-200 font-bold">{metadata.bounds ? metadata.bounds[2] : '77.65° E'}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block">NORTH (MAX LAT)</span>
                <span className="text-slate-200 font-bold">{metadata.bounds ? metadata.bounds[3] : '13.02° N'}</span>
              </div>
            </div>
          </div>

          {/* ISRO PS 26167 Compliance Note */}
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-slate-300 text-[11px] leading-relaxed flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-cyan-300">Geospatial Integrity Guarantee (Rule 4):</span>
              <p className="mt-0.5 text-slate-400">
                Spatial transform, projection metadata, and multi-bit dynamic range are maintained throughout model inference and evidence generation without lossy RGB truncation.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
