export class NoProcessorException extends Error {
  constructor() {
    super(`No processor found`);
    this.name = 'NoProcessorException';
  }
}
