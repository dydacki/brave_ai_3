export interface Json<T> {
  task: string;
  apikey: string;
  answer: T;
}

export interface JsonResponse {
  code: number;
  message: string;
}
