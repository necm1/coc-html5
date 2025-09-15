export class Logger {
  constructor(private readonly name = 'Logger') {}

  public info(...args: any[]): void {
    console.log(
      `%c${this.getTimestamp()} - ${this.name}:`,
      'color: #2196f3; font-weight: bold;',
      ...args
    );
  }

  public warn(...args: any[]): void {
    console.warn(
      `%c${this.getTimestamp()} - ${this.name}:`,
      'color: #ff9800; font-weight: bold;',
      ...args
    );
  }

  public error(...args: any[]): void {
    console.error(
      `%c${this.getTimestamp()} - ${this.name}:`,
      'color: #f44336; font-weight: bold;',
      ...args
    );
  }

  public success(...args: any[]): void {
    console.log(
      `%c${this.getTimestamp()} - ${this.name}:`,
      'color: #4caf50; font-weight: bold;',
      ...args
    );
  }

  public debug(...args: any[]): void {
    console.debug(
      `%c${this.getTimestamp()} - ${this.name}:`,
      'color: #9c27b0; font-weight: bold;',
      ...args
    );
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }
}
