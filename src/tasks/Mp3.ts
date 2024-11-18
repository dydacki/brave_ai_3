import {FileUtils} from '@utils/FileUtils';
import {Task} from './Task';
import * as path from 'path';
import * as fs from 'fs/promises';
import {OpenAiClient} from '@clients/OpenAiClient';

export class Mp3 extends Task {
  private openAiClient: OpenAiClient;
  private readonly inputDir = `${import.meta.dir}/../utils/files/mp3`;
  private readonly transcriptionDir = `${import.meta.dir}/../utils/files/mp3/transcriptions`;

  constructor() {
    super();
    this.openAiClient = new OpenAiClient();
  }

  async perform(): Promise<void> {
    const transcriptions = await this.getTranscriptions();

    console.log('MP3 task completed:  ^(.)^(.)');
  }

  private async getTranscriptions(): Promise<string[]> {
    const transcriptionFiles = await FileUtils.getFilesWithExtension(this.transcriptionDir, 'txt');
    if (transcriptionFiles.length > 0) {
      console.log(`Found ${transcriptionFiles.length} transcription files to process`);
      return await Promise.all(
        transcriptionFiles.map(file => fs.readFile(path.join(this.transcriptionDir, file), 'utf8')),
      );
    } else {
      const files = await FileUtils.getFilesWithExtension(this.inputDir, 'm4a');
      console.log(`Found ${files.length} m4a files to process`);
      const transcriptions = await Promise.all(
        files.map(async file => ({
          file: file.replace('m4a', 'txt'),
          transcription: await this.transcribe(file),
        })),
      );

      await this.saveTranscriptions(transcriptions);
      return transcriptions.map(t => t.transcription);
    }
  }

  private async transcribe(audioFile: string): Promise<string> {
    console.log(`Transcribing ${audioFile}...`);
    const audioBuffer = await fs.readFile(path.join(this.inputDir, audioFile));
    return this.openAiClient.transcribe(audioBuffer);
  }

  private async saveTranscriptions(transcriptions: {file: string; transcription: string}[]): Promise<void> {
    await Promise.all(
      transcriptions.map(transcription =>
        fs.writeFile(path.join(this.transcriptionDir, transcription.file), transcription.transcription),
      ),
    ).catch(error => {
      console.error(`Error saving transcriptions:`, error);
    });
  }
}
