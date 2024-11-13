import 'dotenv/config';
import {ChatOpenAI} from '@langchain/openai';

export const useChatOpenAI = () => {
  return new ChatOpenAI({
    openAIApiKey: process.env.OPEN_AI_API_KEY,
    model: 'gpt-4o-mini',
    temperature: 0,
  });
};
