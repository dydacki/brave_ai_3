export interface CompletionResult {
  cities?: string[];
  names?: string[];
}

export interface ApiInput {
  apikey: string;
  query: string;
}

export interface ApiResponse {
  code: number;
  message: string;
}
