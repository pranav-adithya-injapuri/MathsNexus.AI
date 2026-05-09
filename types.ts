
export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface SequenceData {
  n: number;
  value: number;
}

export interface SeriesRaceData {
  id: string;
  name: string;
  formula: string;
  color: string;
  history: { t: number; val: number }[];
  converged: boolean;
  convergenceTime?: number;
}
