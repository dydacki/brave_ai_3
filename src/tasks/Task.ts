export abstract class Task {
  protected constructor() {
    // Basic constructor, can be extended if needed
  }

  abstract perform(): Promise<void>;
}
