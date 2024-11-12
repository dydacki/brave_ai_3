import {Task} from './Task';

export class AntyCaptcha extends Task {
  async perform(): Promise<void> {
    console.log('AntyCaptcha is performing');
  }
}
