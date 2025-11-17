export interface AiCompletionRequest {
  fullText: string;
  cursorPosition: number;
}

export interface AiCompletionResponse {
  suggestions: {
    label: string;
    type: string; // e.g., "function", "keyword"
  }[];
}
