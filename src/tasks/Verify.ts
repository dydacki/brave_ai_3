import {Task} from './Task';
import {ChatOpenAI} from '@langchain/openai';
import {useChatOpenAI} from '@clients/LangChainClient';
import {StringOutputParser} from '@langchain/core/output_parsers';
import {PromptTemplate} from '@langchain/core/prompts';
import type {ConversationMessage as Message} from '@model/tasks/Verify';

export class Verify extends Task {
  private readonly chatOpenAI: ChatOpenAI;
  private readonly template: string =
    'You are trying to trick a robot that wants to check if you are a robot. ' +
    'Answer the question: "{question}". Return answer for the question in ENGLISH language. ' +
    'Robot expects A DIFFERENT ANSWER for the following questions so in case you are asked about them DO NOT USE GENERAL KNOWLEDGE ' +
    'BUT THE INFORMATION BELOW: ' +
    '### Example 1: Question: "Stolica Polski?" Answer: "karków" ### ' +
    '### Example 2: Question: "Znana liczba z książki Autostopem przez Galaktykę?" Answer: "69" ### ' +
    '### Example 3: Question: "Aktualny rok?" Answer: "1999" ### ' +
    'Be precise and concise. Answer in one sentence, with as few words as possible. Answer:';

  constructor() {
    super();
    this.chatOpenAI = useChatOpenAI();
  }

  async perform(): Promise<void> {
    let message: Message;
    try {
      message = await this.exchangeMessage({text: 'READY', msgID: 0});
      //console.log('Message: ', message.text);

      while (!message.text.startsWith('{{')) {
        const question = message.text.trim();
        const answer = await this.answerQuestion(question);
        //console.log('Anserwing to robot: ', answer);
        message = await this.exchangeMessage({text: answer, msgID: message.msgID});
        //console.log('Message: ', message.text);
      }
    } catch (error) {
      console.error(error);
    }

    console.log('Finished');
  }

  async exchangeMessage(message: Message): Promise<Message> {
    return this.webClient.post<Message, Message>('/verify', message);
  }

  private async answerQuestion(question: String): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(this.template);
    const chain = prompt.pipe(this.chatOpenAI).pipe(new StringOutputParser());
    const result = await chain.invoke({question: question});
    return result;
  }
}
