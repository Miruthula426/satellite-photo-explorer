export interface AnalysisResult {
  celestialBody: string;
  featureName: string;
  satelliteMission: string;
  definition: string;
  inDepthDetail: string;
  satelliteImagingDetails: string;
  keyFacts: string[];
  suggestedQuestions: string[];
}

export interface QuestionAnswer {
  id: string;
  question: string;
  definition: string;
  detailedExplanation: string;
  satelliteContext: string;
  followUpQuestions: string[];
  timestamp: number;
}

export interface PresetSatellitePhoto {
  id: string;
  title: string;
  celestialBody: string;
  mission: string;
  imageUrl: string;
  thumbnailUrl: string;
  description: string;
  sampleQuestions: string[];
}

export interface ActivePhoto {
  id: string;
  title: string;
  sourceType: 'preset' | 'upload' | 'url';
  dataUrl: string;
  mimeType: string;
  timestamp: number;
}
