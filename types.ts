export interface Article {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

export enum TTSVoice {
  Kore = 'Kore',
  Puck = 'Puck',
  Fenrir = 'Fenrir',
  Charon = 'Charon',
  Zephyr = 'Zephyr'
}

export interface GenerationState {
  status: 'idle' | 'summarizing' | 'generating_audio' | 'ready' | 'error';
  error?: string;
}

export interface AudioData {
  buffer: AudioBuffer;
  duration: number;
}
