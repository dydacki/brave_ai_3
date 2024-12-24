import {Task} from './Task';
import type {Query} from '@model/tasks/Database';
import {messages, functions} from '@utils/constants/Database';
import {OpenAiClient} from '@clients/OpenAiClient';
import type {Json, JsonResponse} from '@model/tasks/Task';

export class Database extends Task {
  private readonly openAiClient: OpenAiClient;

  constructor() {
    super();
    this.openAiClient = new OpenAiClient();
  }

  async perform(): Promise<void> {
    try {
      const completionParams = {
        messages,
        functions,
        functionCallbacks: {
          getTables: this.getTables.bind(this),
          getTableSchema: this.getTableSchema.bind(this),
          getQueryResult: this.getQueryResult.bind(this),
        },
      };

      const queryResult = await this.openAiClient.completionWithFunctions(completionParams);
      const resultArray = JSON.parse(queryResult) as number[];
      const json = this.createJson(resultArray, 'database');
      const taskResponse = await this.webClient.post<Json<number[]>, JsonResponse>('/report', json);
      console.log(taskResponse);
    } catch (error) {
      console.error(error);
    }
  }

  async getQueryResult(param: {query: string}): Promise<any> {
    const url = '/apidb';
    const payload: Query = {
      task: 'database',
      apikey: process.env.AI_DEVS_API_KEY as string,
      query: param.query,
    };

    const response = await this.webClient.post<Query, any>(url, payload);
    return response;
  }

  async getTableSchema(param: {tableName: string}): Promise<any> {
    return this.getQueryResult({query: `show create table ${param.tableName}`});
  }

  async getTables(): Promise<any> {
    return this.getQueryResult({query: 'show tables'});
  }
}
