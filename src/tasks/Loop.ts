import {Task} from './Task';
import type {Json, JsonResponse} from '@model/tasks/Task';
import {OpenAiClient} from '@clients/OpenAiClient';
import {messages as loopMessages} from '@utils/constants/Loop';
import type {ChatCompletionMessageParam, ChatCompletion} from 'openai/resources/chat/completions';
import type {ApiInput, ApiResponse, CompletionResult} from '@model/tasks/Loop';
import {normalizePolishChars} from '@utils/StringUtils';

export class Loop extends Task {
  private readonly openAiClient: OpenAiClient;
  private readonly notesUrl: string = '/dane/barbara.txt';
  private readonly apiKey: string = process.env.AI_DEVS_API_KEY as string;

  constructor() {
    super();
    this.openAiClient = new OpenAiClient();
  }

  async perform(): Promise<void> {
    let lastBarbarasPlace: string | null = null;
    const checkedPlaces: string[] = [];

    try {
      const notes = await this.webClient.get<string>(this.notesUrl, 'string');
      const userMessage: ChatCompletionMessageParam = {role: 'user', content: notes};
      const messages = [...loopMessages, userMessage];
      const completion = (await this.openAiClient.completion({messages})) as ChatCompletion;

      if (completion.choices[0].message.content) {
        const result = JSON.parse(completion.choices[0].message.content) as CompletionResult;
        result.names = result.names?.filter(name => name !== 'Barbara').map(name => name.toUpperCase());

        let newNames: string[] = [...result.names!];
        while (newNames.length > 0) {
          const name = newNames.shift();
          if (name) {
            const places = await this.getPlacesForPerson(name);
            const newPlaces = places.filter(place => !checkedPlaces.includes(place));
            checkedPlaces.push(...newPlaces);
            for (const place of newPlaces) {
              const peopleNames = await this.getPeopleFromPlace(place);
              if (peopleNames.includes('BARBARA')) {
                console.log('BARBARA found in ', place);
                lastBarbarasPlace = place;
              }
              const newPeople = peopleNames
                .filter(person => !newNames.includes(person))
                .filter(person => person !== 'BARBARA');
              newNames.push(...newPeople);
            }
          }
        }

        const json = this.createJson(lastBarbarasPlace!, 'loop');
        const taskResponse = await this.webClient.post<Json<string>, JsonResponse>('/report', json);
        console.log(taskResponse);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async getPlacesForPerson(personName: string): Promise<string[]> {
    return this.query(personName, '/people');
  }

  async getPeopleFromPlace(personName: string): Promise<string[]> {
    return this.query(personName, '/places');
  }

  async query(query: string, url: string): Promise<string[]> {
    const payload: ApiInput = {apikey: this.apiKey, query};
    const response = await this.webClient.post<ApiInput, ApiResponse>(url, payload);
    return response.message
      .replace('[**RESTRICTED DATA**]', '')
      .replace('GLITCH', '')
      .split(' ')
      .map(name => normalizePolishChars(name).toUpperCase());
  }
}
