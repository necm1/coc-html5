export abstract class Entity<T = unknown> {
  public load(...args: any[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
