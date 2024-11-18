import {FileUtils} from '@utils/FileUtils';
import {Task} from './Task';
import * as path from 'path';
import * as fs from 'fs/promises';
import {OpenAiClient} from '@clients/OpenAiClient';
import type {ChatOpenAI} from '@langchain/openai';
import {useChatOpenAI} from '@clients/LangChainClient';
import {StringOutputParser} from '@langchain/core/output_parsers';
import {PromptTemplate} from '@langchain/core/prompts';
import type {Json, JsonResponse} from '@model/tasks/Task';

export class Mp3 extends Task {
  private openAiClient: OpenAiClient;
  private readonly chatOpenAI: ChatOpenAI;
  private readonly inputDir = `${import.meta.dir}/../utils/files/mp3`;
  private readonly transcriptionDir = `${import.meta.dir}/../utils/files/mp3/transcriptions`;
  private readonly template: string =
    'Below are the transcriptions of the audio files. They include testimoniies of people being friends to Andrzej Maj. ' +
    'Figure out the full address of the School Andrej Maj is a lecturer at. ' +
    'Ignore all the information about Andrzej Maj before he moved to another city ' +
    'Ignore all the information about people with last name MAJ but not Andrzej Maj.' +
    'Ignore all the information not related to the school.' +
    'Ignore information about addresses in Warsaw.' +
    'Notice the information about one of the Polish kings that the university is named after.' +
    'Transcriptions are in Polish. ' +
    'The school is in Krakow Poland. Use your internal knowledge about the city to find the exact address.' +
    '<transcriptions>' +
    '{transcriptions} ' +
    '</transcriptions>' +
    'Give only the address of the school. Be concise and precise. Answer:';

  constructor() {
    super();
    this.chatOpenAI = useChatOpenAI();
    this.openAiClient = new OpenAiClient();
  }

  async perform(): Promise<void> {
    const transcriptions = await this.getTranscriptions();
    const prompt = this.template.replace('{transcriptions}', transcriptions.join('\n'));
    try {
      const result = await this.invoke(prompt);
      console.log(result);
      const json = this.createJson(result, 'mp3');
      const response = await this.webClient.post<Json<string>, JsonResponse>('/report', json);
      console.log(response);
    } catch (error) {
      console.error(error);
    }
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
      const transcriptions: {file: string; transcription: string}[] = [];
      for (const audioFile of files) {
        try {
          console.log(`Processing ${files.indexOf(audioFile) + 1}/${files.length}: ${audioFile}`);
          const transcription = await this.transcribe(audioFile);
          const file = `${path.parse(audioFile).name}.txt`;
          transcriptions.push({file, transcription});
          console.log(`Successfully processed ${audioFile}`);
        } catch (error) {
          console.error(`Error processing ${audioFile}:`, error);
          transcriptions.push({
            file: audioFile,
            transcription: '', // or handle error case as needed
          });
        }
      }

      await this.saveTranscriptions(transcriptions);
      return transcriptions.map(t => t.transcription);
    }
  }

  private async transcribe(audioFile: string): Promise<string> {
    console.log(`Transcribing ${audioFile}...`);
    const audioBuffer = await fs.readFile(path.join(this.inputDir, audioFile));
    return this.openAiClient.transcribeGroq(audioBuffer);
  }

  private async saveTranscriptions(transcriptions: {file: string; transcription: string}[]): Promise<void> {
    await fs.mkdir(this.transcriptionDir, {recursive: true});

    await Promise.all(
      transcriptions.map(transcription =>
        fs.writeFile(path.join(this.transcriptionDir, transcription.file), transcription.transcription),
      ),
    ).catch(error => {
      console.error(`Error saving transcriptions:`, error);
    });
  }

  private async invoke(transcriptions: string): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(this.template);
    const chain = prompt.pipe(this.chatOpenAI).pipe(new StringOutputParser());
    const result = await chain.invoke({transcriptions: transcriptions});
    return result;
  }
}
