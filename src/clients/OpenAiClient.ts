import OpenAI, {toFile} from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import {createByModelName} from '@microsoft/tiktokenizer';
import type {CreateEmbeddingResponse} from 'openai/resources/embeddings';
import Groq from 'groq-sdk';
import type {ImagesResponse} from 'openai/resources/images.mjs';

export class OpenAiClient {
  private openai: OpenAI;
  private tokenizers: Map<string, Awaited<ReturnType<typeof createByModelName>>> = new Map();
  private readonly IM_START = '<|im_start|>';
  private readonly IM_END = '<|im_end|>';
  private readonly IM_SEP = '<|im_sep|>';
  private groq: Groq;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPEN_AI_API_KEY,
    });
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  private async getTokenizer(modelName: string) {
    if (!this.tokenizers.has(modelName)) {
      const specialTokens: ReadonlyMap<string, number> = new Map([
        [this.IM_START, 100264],
        [this.IM_END, 100265],
        [this.IM_SEP, 100266],
      ]);
      const tokenizer = await createByModelName(modelName, specialTokens);
      this.tokenizers.set(modelName, tokenizer);
    }
    return this.tokenizers.get(modelName)!;
  }

  async countTokens(messages: ChatCompletionMessageParam[], model: string = 'gpt-4o'): Promise<number> {
    const tokenizer = await this.getTokenizer(model);

    let formattedContent = '';
    messages.forEach(message => {
      formattedContent += `${this.IM_START}${message.role}${this.IM_SEP}${message.content || ''}${this.IM_END}`;
    });
    formattedContent += `${this.IM_START}assistant${this.IM_SEP}`;

    const tokens = tokenizer.encode(formattedContent, [this.IM_START, this.IM_END, this.IM_SEP]);
    return tokens.length;
  }

  async completion(config: {
    messages: ChatCompletionMessageParam[];
    model?: string;
    stream?: boolean;
    temperature?: number;
    jsonMode?: boolean;
    maxTokens?: number;
  }): Promise<OpenAI.Chat.Completions.ChatCompletion | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    const {messages, model = 'gpt-4o', stream = false, jsonMode = false, maxTokens = 4096, temperature = 0} = config;
    try {
      const chatCompletion = await this.openai.chat.completions.create({
        messages,
        model,
      });

      return chatCompletion as OpenAI.Chat.Completions.ChatCompletion;
    } catch (error) {
      console.error('Error in OpenAI completion:', error);
      throw error;
    }
  }

  async completionWithFunctions<TFunctionResult = any>(config: {
    messages: ChatCompletionMessageParam[];
    model?: string;
    stream?: boolean;
    temperature?: number;
    jsonMode?: boolean;
    maxTokens?: number;
    functions: ChatCompletionTool[];
    functionCallbacks: Record<string, (args: any) => Promise<TFunctionResult>>;
  }): Promise<TFunctionResult> {
    const {messages, model = 'gpt-4o', stream = false, jsonMode = false, maxTokens = 4096, temperature = 0} = config;
    let currentMessages = [...messages];

    while (true) {
      try {
        const chatCompletion = await this.openai.chat.completions.create({
          messages: currentMessages,
          model,
          tools: config.functions,
          tool_choice: 'auto',
          temperature,
          max_tokens: maxTokens,
        });

        const message = chatCompletion.choices[0].message;

        console.log(message);
        currentMessages.push(message);
        if (!message.tool_calls) {
          return message.content as TFunctionResult;
        }

        for (const toolCall of message.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log('----- BEGIN LOGGING A SINGLE TOOL CALL -----');
          console.log(`Calling ${functionName} with args:`, functionArgs);
          const functionResult = await config.functionCallbacks[functionName](functionArgs);
          console.log(`${functionName} result:`, functionResult);
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResult),
          });

          console.log('----- END LOGGING A SINGLE TOOL CALL -----');
        }
      } catch (error) {
        console.error('Error in OpenAI completion:', error);
        throw error;
      }
    }
  }

  isStreamResponse(
    res: ChatCompletion | AsyncIterable<ChatCompletionChunk>,
  ): res is AsyncIterable<ChatCompletionChunk> {
    return Symbol.asyncIterator in res;
  }

  parseJsonResponse<IResponseFormat>(response: ChatCompletion): IResponseFormat | {error: string; result: boolean} {
    try {
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Invalid response structure');
      }
      const parsedContent = JSON.parse(content);
      return parsedContent;
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return {error: 'Failed to process response', result: false};
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response: CreateEmbeddingResponse = await this.openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }

  async speak(text: string) {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });

    console.log('Response:', response.body);
    const stream = response.body;
    return stream;
  }

  async transcribe(audioBuffer: Buffer): Promise<string> {
    console.log('Transcribing audio...');

    const transcription = await this.openai.audio.transcriptions.create({
      file: await toFile(audioBuffer, 'speech.m4a'),
      language: 'pl',
      model: 'whisper-1',
    });
    return transcription.text;
  }

  async transcribeGroq(audioBuffer: Buffer): Promise<string> {
    const transcription = await this.groq.audio.transcriptions.create({
      file: await toFile(audioBuffer, 'speech.mp3'),
      language: 'pl',
      model: 'whisper-large-v3',
    });
    return transcription.text;
  }

  async generateImage(
    prompt: string,
    model: 'dall-e-2' | 'dall-e-3' = 'dall-e-2',
    quality: 'standard' | 'hd' = 'standard',
    size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024',
    style: 'natural' | 'vivid' = 'natural',
    n: number = 1,
    format: 'url' | 'b64_json' = 'url',
    extension: 'png' | 'webp' = 'png',
  ): Promise<ImagesResponse> {
    try {
      const response = await this.openai.images.generate({
        model,
        prompt,
        n,
        quality,
        size,
        style,
        response_format: format,
      });

      return response;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }

  async readImageText(imageBuffer: Buffer): Promise<string> {
    try {
      const base64Image = imageBuffer.toString('base64');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that can answer questions and help with tasks.',
          },
          {
            role: 'user',
            content: [
              {type: 'text', text: 'What text do you see in this image? Return only the text content.'},
              {type: 'image_url', image_url: {url: `data:image/png;base64,${base64Image}`}},
            ],
          },
        ],
        max_tokens: 500,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error reading image text:', error);
      throw error;
    }
  }

  async interpretImage(imageBuffer: Buffer): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that can analyze images. Please describe what you see in detail. Reply in Polish.',
          },
          {
            role: 'user',
            content: [
              {type: 'text', text: 'What do you see in this image? Describe it in detail. Reply in Polish.'},
              {type: 'image_url', image_url: {url: `data:image/png;base64,${imageBuffer.toString('base64')}`}},
            ],
          },
        ],
        max_tokens: 500,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error interpreting image:', error);
      throw error;
    }
  }

  async interpretImageWithInstructions(imageBuffer: Buffer, instructions: string): Promise<string> {
    const messages = [
      {
        role: 'user',
        content: [
          {type: 'text', text: instructions},
          {type: 'image_url', image_url: {url: `data:image/png;base64,${imageBuffer.toString('base64')}`}},
        ],
      },
      {
        role: 'system',
        content: 'You are a helpful assistant that can analyze images. Please describe what you see in detail.',
      },
    ] as ChatCompletionMessageParam[];

    try {
      const response = await this.openai.chat.completions.create({
        messages,
        model: 'gpt-4o',
        max_tokens: 500,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error interpreting image with instructions:', error);
      throw error;
    }
  }
}
