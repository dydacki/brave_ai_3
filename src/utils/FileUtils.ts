import * as fs from 'fs/promises';
import * as path from 'path';

export class FileUtils {
  static async getFilesWithExtension(directoryPath: string, extensions: string | string[]): Promise<string[]> {
    try {
      await fs.access(directoryPath);
    } catch {
      console.log(`Directory ${directoryPath} does not exist`);
      return [];
    }

    const extensionArray = Array.isArray(extensions)
      ? extensions.map(ext => (ext.toLowerCase().startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`))
      : [extensions.toLowerCase().startsWith('.') ? extensions.toLowerCase() : `.${extensions.toLowerCase()}`];

    try {
      const files = await fs.readdir(directoryPath);
      return files.filter(f => extensionArray.includes(path.extname(f).toLowerCase()));
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

  static async saveBuffer(buffer: Buffer, outputPath: string, filename: string): Promise<void> {
    try {
      await fs.mkdir(outputPath, {recursive: true});
      const fullPath = path.join(outputPath, filename);
      await fs.writeFile(fullPath, Buffer.from(buffer));
    } catch (error) {
      console.error('Error saving buffer:', error);
      throw error;
    }
  }

  static async readFileContent(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    try {
      return await fs.readFile(filePath, encoding);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      throw error;
    }
  }
}
