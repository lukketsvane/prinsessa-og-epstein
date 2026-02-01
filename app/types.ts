export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error'
}
