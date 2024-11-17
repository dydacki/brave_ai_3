import {Task} from './Task';

export class Mp3 extends Task {
  constructor() {
    super();
  }

  async perform(): Promise<void> {
    // TODO: Implement MP3 task logic
    //const response = await this.webClient.post('/mp3', this.createJson({}, 'mp3'));
    console.log('MP3 task completed:  ^(.)^(.)');
  }
}
