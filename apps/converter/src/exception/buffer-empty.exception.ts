export class BufferEmptyException extends Error {
  constructor() {
    super('Buffer is empty or not initialized.');
    this.name = 'BufferException';
  }
}
