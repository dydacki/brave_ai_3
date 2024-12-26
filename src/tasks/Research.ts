import {Task} from './Task';
import {OpenAiClient} from '@clients/OpenAiClient';
import type {Json, JsonResponse} from '@model/tasks/Task';
import {FileUtils} from '@utils/FileUtils';
import {messages} from '@utils/constants/Research';
import type {ChatCompletionMessageParam, ChatCompletion} from 'openai/resources/chat/completions';
import type {ChatGptTrainingData} from '@model/tasks/Research';

export class Research extends Task {
  private readonly openAiClient: OpenAiClient;
  private readonly modelName = 'ft:gpt-4o-mini-2024-07-18:personal:numbers:AimoLdd3';

  constructor() {
    super();
    this.openAiClient = new OpenAiClient();
  }

  async perform(): Promise<void> {
    //await this.prepareTrainingData();
    const verifyData = await this.readVerifyData();
    const correctEntries: string[] = [];
    for (const key in verifyData) {
      const messages = this.messagesFromData(verifyData[key]);
      const completion = (await this.openAiClient.completion({messages, model: this.modelName})) as ChatCompletion;
      if (completion.choices[0].message.content === 'correct') {
        correctEntries.push(key);
      }
    }

    this.sendResponse<string[]>(correctEntries);
  }

  private async sendResponse<T>(arg: any): Promise<void> {
    const json = this.createJson<T>(arg, 'research');
    const taskResponse = await this.webClient.post<Json<string>, JsonResponse>('/report', json);
    console.log(taskResponse);
  }

  private async getFileContent(fileName: string): Promise<string> {
    return FileUtils.readFileContent(`${import.meta.dir}/../utils/files/research/${fileName}`);
  }

  private messagesFromData(data: string): ChatCompletionMessageParam[] {
    return [
      {
        role: 'system',
        content: 'Analyze the numerical sequence and determine if it follows the correct pattern.',
      },
      {
        role: 'user',
        content: data,
      },
    ];
  }

  async prepareTrainingData(): Promise<void> {
    try {
      // Read the data files
      const correctData = await this.getFileContent('correct.txt');
      const incorrectData = await this.getFileContent('incorrect.txt');

      // Process the data
      const trainingData: ChatGptTrainingData[] = [];

      // Process correct data
      const correctLines = correctData.split('\n').filter(line => line.trim());
      for (const line of correctLines) {
        const trainingEntry: ChatGptTrainingData = {
          messages: [
            {
              role: 'system',
              content: 'Analyze the numerical sequence and determine if it follows the correct pattern.',
            },
            {
              role: 'user',
              content: line,
            },
            {
              role: 'assistant',
              content: 'correct',
            },
          ],
        };
        trainingData.push(trainingEntry);
      }

      // Process incorrect data
      const incorrectLines = incorrectData.split('\n').filter(line => line.trim());
      for (const line of incorrectLines) {
        const trainingEntry: ChatGptTrainingData = {
          messages: [
            {
              role: 'system',
              content: 'Analyze the numerical sequence and determine if it follows the correct pattern.',
            },
            {
              role: 'user',
              content: line,
            },
            {
              role: 'assistant',
              content: 'incorrect',
            },
          ],
        };
        trainingData.push(trainingEntry);
      }

      await FileUtils.saveFile(
        // Convert to JSONL format (one JSON per line)
        trainingData.map(entry => JSON.stringify(entry)).join('\n'),
        `${import.meta.dir}/../utils/files/research`,
        'training_data.jsonl',
      );

      console.log(`Created training data with ${trainingData.length} examples`);
    } catch (error) {
      console.error('Error preparing training data:', error);
      throw error;
    }
  }

  private async readVerifyData(): Promise<Record<string, string>> {
    try {
      const content = await this.getFileContent('verify.txt');
      return content
        .split('\n')
        .filter(line => line.trim())
        .reduce((acc, line) => {
          const [key, value] = line.split('=');
          return {...acc, [key]: value};
        }, {});
    } catch (error) {
      console.error('Error reading verify data:', error);
      throw error;
    }
  }
}
