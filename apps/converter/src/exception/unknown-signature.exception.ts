export class UnknownSignatureException extends Error {
  constructor(signature: string) {
    super(`Unknown signature: ${signature}`);
    this.name = 'UnknownSignatureException';
  }
}
