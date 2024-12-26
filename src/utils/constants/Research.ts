import type {ChatCompletionMessageParam, ChatCompletionTool} from 'openai/resources/chat/completions';

export const messages: ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content:
      'You are an expert in preparing data for fine-tuning a ChatGPT model. Prepare a JSONL file from the provided data containing a two dimensional array of numbers, correct and incorrect.' +
      'Return ONLY THE JSON OBJECT, DO NOT WRAP WITH ```xyz ```',
  },
];
