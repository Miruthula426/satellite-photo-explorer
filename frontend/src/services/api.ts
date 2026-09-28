import { AnalysisMode, AnalysisResponse, BenchmarkResult } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface AnalyzePayload {
  images: {
    data: string;
    mimeType: string;
    filename?: string;
    role?: 'primary' | 'secondary' | 'optical' | 'sar';
  }[];
  query: string;
  mode: AnalysisMode | 'auto';
  metadata?: Record<string, any>;
}

export interface ModelDetail {
  name: string;
  task: string;
  implementation: string;
  version: string;
  model_source: string;
  license: string;
  modality: string;
  input_requirements: string;
  device_requirements: string;
  status: 'baseline' | 'loaded' | 'unavailable' | 'demo';
  implementation_status: string;
  is_trained: boolean;
  is_remote_sensing_adapted: boolean;
}

export async function checkBackendHealth(): Promise<{ 
  status: string; 
  version: string; 
  device: string; 
  models: { name: string; status: string; task?: string }[];
  models_loaded: string[] 
}> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend health check error:', err);
    return { status: 'unavailable', version: '1.1.0-offline', device: 'unknown', models: [], models_loaded: [] };
  }
}

export async function fetchLoadedModels(): Promise<{ models: ModelDetail[] }> {
  try {
    const res = await fetch(`${API_BASE}/models`);
    if (!res.ok) throw new Error(`Fetch models failed: ${res.statusText}`);
    const data = await res.json();
    return { models: Array.isArray(data.models) ? data.models : [] };
  } catch (err) {
    console.warn('Fetch models error:', err);
    return { models: [] };
  }
}

export async function submitSatQueryAnalysis(payload: AnalyzePayload): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Analysis request failed (${res.status})`);
  }

  return await res.json();
}

export async function fetchBenchmarkResults(): Promise<{ status: string; results: BenchmarkResult[]; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/evaluation`);
    if (!res.ok) throw new Error('Evaluation fetch failed');
    const data = await res.json();
    return {
      status: data.status || 'not_evaluated',
      results: data.results || [],
      message: data.message || 'Benchmark results will appear after actual evaluation.'
    };
  } catch (err) {
    console.warn('Evaluation fetch error:', err);
    return {
      status: 'not_evaluated',
      results: [],
      message: 'Backend evaluation service currently unreachable or no evaluations persisted.'
    };
  }
}

export async function runSyntheticValidation(seed: number = 42): Promise<any> {
  const res = await fetch(`${API_BASE}/evaluation/synthetic-validation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seed }),
  });
  if (!res.ok) throw new Error('Synthetic validation run failed');
  return await res.json();
}

export async function runOfficialEvaluation(): Promise<any> {
  const res = await fetch(`${API_BASE}/evaluation/official-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Official evaluation call failed');
  return await res.json();
}
