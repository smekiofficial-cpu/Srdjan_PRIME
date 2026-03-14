
export enum AgentMode {
  VOICE = 'VOICE',
  CODE = 'CODE',
  VIDEO = 'VIDEO',
  INSTALL = 'INSTALL',
  YOUTUBE = 'YOUTUBE',
  MEETING = 'MEETING',
  BROWSER = 'BROWSER',
  EXTENSION = 'EXTENSION',
  MEMORY = 'MEMORY',
  WINDOWS = 'WINDOWS'
}

export enum AvatarShape {
  HUMAN = 'HUMAN',
  ROBOT = 'ROBOT'
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  code?: string;
  timestamp: number;
  sources?: { uri: string; title: string }[];
}

export interface VideoGenerationState {
  status: 'idle' | 'generating' | 'completed' | 'error';
  url?: string;
  error?: string;
  progressMessage?: string;
}

export interface TerminalLog {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'command';
  message: string;
  timestamp: number;
}

export interface MemoryEntry {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    timestamp: number;
    type: 'interaction' | 'preference' | 'fact';
    context?: string;
  };
}

export interface SearchResult {
  entry: MemoryEntry;
  similarity: number;
}

export interface NeuralData {
  alpha: number;
  beta: number;
  gamma: number;
  delta: number;
  focus: number;
  stress: number;
  timestamp: number;
}
