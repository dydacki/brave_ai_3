import {TaskFactory} from '@utils/TaskFactory.js';
import {config} from 'dotenv';
config();

TaskFactory.create(Bun.argv[2] || '')
  .then(task => {
    if (!Bun.argv[2]) {
      throw new Error('Task name is required, start your application with "bun run index.ts [task-name]"');
    }
    return task.perform();
  })
  .then(() => {
    console.info(`Task ${Bun.argv[2]} completed`);
  })
  .catch(error => {
    console.error(`Task ${Bun.argv[2]} failed: ${error}`);
    process.exit(1);
  })
  .finally(() => {
    console.info('Application finished');
  });
