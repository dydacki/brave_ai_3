export interface ChatGptTrainingMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatGptTrainingData {
  messages: ChatGptTrainingMessage[];
}
