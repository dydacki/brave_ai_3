import {join} from 'path';
import {Task} from '../tasks/Task';
import {readdir} from 'fs/promises';

export class TaskFactory {
  private static getTasksPath(): string {
    return join(import.meta.dir, '../tasks');
  }

  private static async getTaskFiles(): Promise<string[]> {
    const files = await readdir(this.getTasksPath());
    return files.filter(file => file.endsWith('.ts') && file !== 'Task.ts');
  }

  static async create(taskName: string): Promise<Task> {
    const files = await this.getTaskFiles();

    for (const file of files) {
      if (file.toLowerCase().startsWith(taskName.toLowerCase())) {
        const modulePath = join(this.getTasksPath(), file);
        const taskModule = await import(modulePath);
        const Handler = taskModule[file.replace('.ts', '')];
        return new Handler() as Task;
      }
    }

    throw new Error(`Could not find task: ${taskName}`);
  }
}
