export interface Point {
  id: string;
  text: string;
  fileName: string;
}

export interface SearchResult {
  id: string;
  version: number;
  score: number;
  payload: {
    text: string;
    fileName: string;
  };
}
