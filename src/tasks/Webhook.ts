import {Task} from './Task';
import {OpenAiClient} from '@clients/OpenAiClient';
import type {Json, JsonResponse} from '@model/tasks/Task';
import {messages as webhookMessages} from '@utils/constants/Webhook';
import type {ChatCompletion, ChatCompletionMessageParam} from 'openai/resources/chat/completions';

export class Webhook extends Task {
  private readonly openAiClient: OpenAiClient;
  private readonly instructions: string[] = [
    'poleciałem jedno pole w prawo, a później na sam dół',
    'poleciałem od razu na dół planszy',
    'poleciałem jedno pole w prawo i jedno w dół',
    'ze startu od razu zniosło mnie w prawo na sam koniec planszy',
    'ze startu od razu zniosło mnie w prawo na sam koniec planszy i jedno pole w dół',
    'poleciałem na sam dół, a potem dwa pola w prawo',
    'przeleciałem do końca w prawo a potem na sam dół',
    'poleciałem na sam koniec planszy',
    'poleciałem na sam prawy brzeg planszy i jeszcze dwa pola w prawo',
  ];

  constructor() {
    super();
    this.openAiClient = new OpenAiClient();
  }

  async perform(): Promise<void> {
    for (const instruction of this.instructions) {
      const messages = this.completionMessages(instruction);
      const result = (await this.openAiClient.completion({messages})) as ChatCompletion;
      console.log(
        `Result for the following instruction: ${instruction} is: ${result.choices[0].message.content}\n\n\n`,
      );
    }
  }

  private completionMessages(instruction: string): ChatCompletionMessageParam[] {
    return [
      {
        role: 'user',
        content: instruction,
      },
      ...webhookMessages,
    ];
  }
}
