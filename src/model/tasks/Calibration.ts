export interface Json<T> {
  task: string;
  apikey: string;
  answer: T;
}

export interface JsonResponse {
  code: number;
  message: string;
}

export interface TestQuestion {
  q: string;
  a: string;
}

export interface AdditionProblem {
  question: string;
  answer: number;
  test?: TestQuestion;
}

export interface CalibrationData {
  apikey: string;
  description: string;
  copyright: string;
  'test-data': AdditionProblem[];
}
