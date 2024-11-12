import 'dotenv/config';
import OpenAi from 'openai';

export const useOpenAi = (): OpenAi => {
  return new OpenAi({
    apiKey: process.env.OPEN_AI_API_KEY,
  });
};