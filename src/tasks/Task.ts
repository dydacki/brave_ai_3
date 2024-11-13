export abstract class Task {
  protected constructor() {}

  abstract perform(): Promise<void>;
}
