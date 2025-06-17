/* eslint-disable @typescript-eslint/no-unsafe-function-type */
type HandlerEvent = 'beforeHandle' | 'afterHandle' | 'error';

export enum HandlerEventType {
  'NO_TEXTURE' = 'NO_TEXTURE',
  'ADD_TEXTURE' = 'ADD_TEXTURE',
  'SHAPE_LOADED' = 'SHAPE_LOADED',
  'MOVIE_CLIP_LOADED' = 'MOVIE_CLIP_LOADED',
  'MATRIX_LOADED' = 'MATRIX_LOADED',
  'RESET_MATRIX' = 'RESET_MATRIX',
}

export class HandlerEventEmitter {
  private readonly listeners: { [event: string]: Function[] } = {};

  public static readonly instance = new HandlerEventEmitter();

  private constructor() {
    //
  }

  public static getInstance(): HandlerEventEmitter {
    return HandlerEventEmitter.instance;
  }

  public on(event: HandlerEvent, listener: Function): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }

  public emit(
    event: HandlerEvent,
    payload: { type: HandlerEventType; args: any[] }
  ): void {
    if (this.listeners[event]) {
      for (const listener of this.listeners[event]) {
        listener(payload.type, ...payload.args);
      }
    }
  }
}
