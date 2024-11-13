import {Task} from './Task';
import {WebCrawler} from '@utils/WebCrawler';
import {ChatOpenAI} from '@langchain/openai';
import {useChatOpenAI} from '@clients/LangChainClient';
import {StringOutputParser} from '@langchain/core/output_parsers';
import {PromptTemplate} from '@langchain/core/prompts';

export class AntyCaptcha extends Task {
  private readonly chatOpenAI: ChatOpenAI;
  private readonly webCrawler: WebCrawler;
  private readonly template: string =
    'Answer the question: "{question}". Return answer for the question in POLISH language, ' +
    'Be precise and concise. Answer in one sentence, with as few words as possible. Answer:';

  constructor() {
    super();
    this.chatOpenAI = useChatOpenAI();
    this.webCrawler = new WebCrawler();
  }

  async perform(): Promise<void> {
    const pageContent = await this.webCrawler.fetchPage('https://xyz.ag3nts.org/');
    const question = pageContent.parser('#human-question').text().trim().replace('Question:', '');
    const answer = await this.answerQuestion(question);
  }

  private async answerQuestion(question: String): Promise<String> {
    const prompt = PromptTemplate.fromTemplate(this.template);
    const chain = prompt.pipe(this.chatOpenAI).pipe(new StringOutputParser());
    const result = await chain.invoke({question: question});
    return result;
  }
}
