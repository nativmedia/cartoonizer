export enum AppStep {
  VOUCHER = -2,
  LOGIN = -1,
  STYLE_SELECTION = 0,
  // IMAGE_UPLOAD step removed
  PROCESSING = 2,
  RESULT = 3,
}

export interface CartoonStyle {
  id: string;
  title: string;
  description: string;
  color: string; // Tailwind bg class or hex
  textColor: string;
  illustrationType: 'person' | 'landscape' | 'minimal' | 'pop' | 'aesthetic' | '3d';
  promptModifier: string;
}

export interface GeneratedImage {
  original: string; // Base64
  cartoon: string; // Base64
}