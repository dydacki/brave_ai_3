import * as fs from 'fs/promises';
import * as path from 'path';

export class FileUtils {
  static async getFilesWithExtension(directoryPath: string, extension: string): Promise<string[]> {
    try {
      await fs.access(directoryPath);
    } catch {
      console.log(`Directory ${directoryPath} does not exist`);
      return [];
    }

    try {
      const files = await fs.readdir(directoryPath);
      return files.filter(file => path.extname(file).toLowerCase() === `.${extension.toLowerCase()}`);
    } catch (error) {
      console.error(`Error reading directory ${directoryPath}:`, error);
      throw error;
    }
  }

  static async saveFile(content: string, outputPath: string, filename: string): Promise<void> {
    try {
      await fs.mkdir(outputPath, {recursive: true});
      const fullPath = path.join(outputPath, filename);
      await fs.writeFile(fullPath, content, 'utf-8');
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }
}
