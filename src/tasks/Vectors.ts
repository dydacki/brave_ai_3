import {Task} from './Task';
import {QuadrantClient} from '@clients/QdrantClient';
import {OpenAiClient} from '@clients/OpenAiClient';
import {FileUtils} from '@utils/FileUtils';
import {v4 as uuidv4} from 'uuid';
import type {SearchResult} from '@model/tasks/Vectors';
import type {Json, JsonResponse} from '@model/tasks/Task';

export class Vectors extends Task {
  private readonly COLLECTION_NAME = 'vectors_new';
  private readonly QUESTION = 'W raporcie z którego dnia znajduje się wzmianka o kradzieży prototypu broni?';

  private quadrantClient: QuadrantClient;
  private openAiClient: OpenAiClient;
  private readonly inputDir = `${import.meta.dir}/../utils/files/vectors`;

  constructor() {
    super();
    this.quadrantClient = new QuadrantClient(process.env.VITE_QUADRANT_URL as string);
    this.openAiClient = new OpenAiClient();
  }

  async perform(): Promise<void> {
    try {
      await this.quadrantClient.ensureDeleted(this.COLLECTION_NAME);
      await this.quadrantClient.ensureCollection(this.COLLECTION_NAME);
      const textContents = await this.loadFileContents(this.inputDir);
      const pointsToUpsert = Array.from(textContents.entries()).map(([file, content]) => ({
        id: uuidv4(),
        text: content,
        fileName: file,
      }));

      await this.quadrantClient.upsert(this.COLLECTION_NAME, pointsToUpsert);
      const embedding = await this.openAiClient.createEmbedding(this.QUESTION);
      const results = (await this.quadrantClient.performSearch(this.COLLECTION_NAME, embedding)) as SearchResult[];
      const date = this.extractDateFromSearchResult(results);
      await this.sendResponse(date);
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  private async loadFileContents(directory: string): Promise<Map<string, string>> {
    const files = await FileUtils.getFilesWithExtension(directory, ['txt']);
    const fileMap = new Map<string, string>();

    for (const file of files) {
      const content = await FileUtils.readFileContent(`${directory}/${file}`);
      const cleanedContent = content
        .split('\n')
        .filter(line => line.trim() !== '')
        .join('\n');
      fileMap.set(file, cleanedContent);
    }

    return fileMap;
  }

  private extractDateFromSearchResult(result: SearchResult[]): string {
    const fileName = result[0].payload.fileName;
    const date = fileName.replace('.txt', '').replace('_', '-').replace('_', '-');
    return date;
  }

  private async sendResponse(date: string): Promise<void> {
    const json = this.createJson(date, 'wektory');
    const response = await this.webClient.post<Json<string>, JsonResponse>('/report', json);
    console.log(response);
  }
}
