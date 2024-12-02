import {Task} from './Task';
import {QuadrantClient} from '@clients/QdrantClient';
import {FileUtils} from '@utils/FileUtils';

export class Vectors extends Task {
  private quadrantClient: QuadrantClient;
  private readonly inputDir = `${import.meta.dir}/../utils/files/vectors`;

  constructor() {
    super();
    this.quadrantClient = new QuadrantClient(process.env.VITE_QUADRANT_URL as string);
  }

  async perform(): Promise<void> {
    const textContents = await this.loadFileContents(this.inputDir);
    console.log(textContents);
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
}
