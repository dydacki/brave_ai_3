import {Task} from './Task';
import {OpenAiClient} from '@clients/OpenAiClient';
import type {Json, JsonResponse} from '@model/tasks/Task';
import {FileUtils} from '@utils/FileUtils';
import {StringOutputParser} from '@langchain/core/output_parsers';
import {PromptTemplate} from '@langchain/core/prompts';
import {useChatOpenAI} from '@clients/LangChainClient';
import type {ChatOpenAI} from '@langchain/openai';
import type {ChatCompletion, ChatCompletionMessageParam} from 'openai/resources/chat/completions';

export class Documents extends Task {
  private openAiClient: OpenAiClient;
  private chatOpenAI: ChatOpenAI;
  private summaryTemplate: string =
    'You are given an unstructured text split with two "\n\n": {text}. ' +
    'Your task is to categorize the text into one of the following categories: ' +
    'people, hardware, animals or other. ' +
    'If the text says "entry deleted", skip it in categorization. ' +
    'If a person is mentioned as a developer, include information about languages one uses.' +
    'If a person is found, incliude the sector name the person was found in.' +
    'Be concise, use at most 2 simple sentences to summarize each paragraph, if possible, do it in one sentence. ' +
    'Return anser as string in the following format: "category: summary" split by "\n\n"' +
    'Answer in Polish language. Answer:';

  private reportSummaryTemplate: string =
    'You are given a text: {text}. ' +
    'Your task is to categorize the text into one of the following categories: ' +
    'people, hardware, animals or other. ' +
    'If the text says "entry deleted", skip it in categorization. ' +
    'If a person is mentioned as a developer, include information about languages one uses.' +
    'Be concise, use at most 2 simple sentences to summarize the text, if possible, do it in one sentence. ' +
    'Return the answer in Polish language. Answer:';

  constructor() {
    super();
    this.chatOpenAI = useChatOpenAI();
    this.openAiClient = new OpenAiClient();
  }

  async perform(): Promise<void> {
    try {
      const facts = await this.loadFileContents(`${import.meta.dir}/../utils/files/categories/facts`);
      const reports = await this.loadFileContentsWithNames(`${import.meta.dir}/../utils/files/categories`);
      const factsSummary = await this.invoke(this.summaryTemplate, facts);

      const reportsSummary = new Map<string, string>();
      for (const [fileName, content] of reports.entries()) {
        const summary = await this.invoke(this.reportSummaryTemplate, content);
        reportsSummary.set(fileName, summary);
      }

      const combinedSummary = [factsSummary, ...reportsSummary.values()].join('\n\n');

      const keyWordForFiles: Record<string, string> = {};
      for (const [fileName, content] of reports.entries()) {
        const sector = this.extractSectorFromFilename(fileName);
        const keyWords = await this.extractKeyWords(combinedSummary, sector, content);
        keyWordForFiles[fileName] = keyWords;
      }

      const json = this.createJson(keyWordForFiles, 'dokumenty');
      const response = await this.webClient.post<Json<Record<string, string>>, JsonResponse>('/report', json);
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

  private async loadFileContents(directory: string): Promise<string> {
    const files = await FileUtils.getFilesWithExtension(directory, ['txt']);
    const contents = await Promise.all(files.map(file => FileUtils.readFileContent(`${directory}/${file}`)));
    return contents
      .map(content =>
        content
          .split('\n')
          .filter(line => line.trim() !== '')
          .join('\n'),
      )
      .join('\n\n');
  }

  private async loadFileContentsWithNames(directory: string): Promise<Map<string, string>> {
    const files = await FileUtils.getFilesWithExtension(directory, ['txt']);
    const contentsMap = new Map<string, string>();

    for (const file of files) {
      const content = await FileUtils.readFileContent(`${directory}/${file}`);
      const processedContent = content
        .split('\n')
        .filter(line => line.trim() !== '')
        .join('\n');
      contentsMap.set(file, processedContent);
    }

    return contentsMap;
  }

  private extractSectorFromFilename(filename: string): string {
    const sectorPart = filename.split('sektor_')[1];
    if (!sectorPart) return '';

    const sectorNumber = sectorPart.replace('.txt', '');
    return `Sektor ${sectorNumber}`;
  }

  private async invoke(template: string, text: string): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(this.chatOpenAI).pipe(new StringOutputParser());
    const result = await chain.invoke({text: text});
    return result;
  }

  private async extractKeyWords(context: string, sector: string, text: string): Promise<string> {
    const userMessage: ChatCompletionMessageParam = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `<context>${context}</context>

        <text>${text}</text>
        <sector>${sector}</sector>
        
        Please extract all the key words from the report <text>, return them in Polish language, as nouns and adjectives in the nominative case. 
        Ensure the list items are unique. 
        The results should consider the context <context> and be splitted with comma. 
        If you find any names in the test, include information about them from the context in the form NAME, OCCUPATION. If the person is claimed developer, include languages one uses.
        Include sector name but limit youtself to <sector> tags.
        Respond only with the concise content and nothing else.`,
        },
      ],
    };

    const result = (await this.openAiClient.completion({
      messages: [userMessage],
      model: 'o1-mini',
      stream: false,
    })) as ChatCompletion;
    return result.choices[0].message.content || '';
  }
}
