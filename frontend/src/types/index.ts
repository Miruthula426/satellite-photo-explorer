export type AnalysisMode = 'single' | 'optical_sar' | 'bitemporal';

export type TaskType = 
  | 'vqa' 
  | 'captioning' 
  | 'grounding' 
  | 'change_detection' 
  | 'change_vqa' 
  | 'optical_sar';

export interface BoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  label?: string;
  confidence?: number | null;
}

export interface GeoTIFFMetadata {
  filename: string;
  crs: string | null;
  bounds: [number, number, number, number] | null;
  width: number;
  height: number;
  bands: number;
  dtype: string;
  nodata: number | null;
  modality: 'OPTICAL' | 'SAR' | 'MULTISPECTRAL' | 'UNKNOWN';
  acquisition_date?: string | null;
  sensor?: string | null;
}

export interface VisualEvidence {
  id: string;
  type: 'original' | 'processed' | 'overlay' | 'mask' | 'boxes' | 'change_map' | 'fused';
  title: string;
  description?: string;
  artifact_url?: string;
  data_base64?: string;
  boxes?: BoundingBox[];
  statistics?: Record<string, number | string>;
}

export interface TraceStep {
  step: string;
  timestamp: string;
  detail: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

export interface ExecutionTrace {
  task: TaskType;
  models_selected: string[];
  steps: TraceStep[];
  parameters: Record<string, any>;
  execution_time_ms: number;
}

export interface AnalysisResponse {
  id: string;
  task: TaskType;
  mode: AnalysisMode;
  answer: string;
  confidence: number | null;
  confidence_label: string; // e.g. "Calibrated 92%" or "Not available"
  models: string[];
  evidence: VisualEvidence[];
  trace: ExecutionTrace;
  metadata?: Record<string, any>;
  execution_time_ms: number;
  created_at: string;
}

export interface PresetPhoto {
  id: string;
  title: string;
  mode: AnalysisMode;
  modality: string;
  sensor: string;
  description: string;
  imageUrl: string;
  imageUrlSecondary?: string; // For bi-temporal or optical/sar pairs
  sampleQueries: string[];
  metadata?: Partial<GeoTIFFMetadata>;
}

export interface BenchmarkResult {
  dataset: string;
  task: string;
  model: string;
  metric: string;
  score: string;
  date: string;
}
