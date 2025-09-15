import { Container } from 'pixi.js';
import { ClashCore } from './core';
import { GameArea } from '@coc/gamearea';
import { Logger } from '@coc/utils';

export class ClashWorld extends Container {
  private readonly logger: Logger = new Logger(ClashWorld.name);
  private core: ClashCore = ClashCore.getInstance();
  private _gameArea: GameArea = new GameArea();

  constructor() {
    super();

    this.sortableChildren = true;
    this.interactiveChildren = true;
    this.hitArea = null;
    this.cursor = 'default';
  }

  public async init() {
    this._gameArea.core = this.core;

    await this._gameArea.init();
    this.addChild(this._gameArea as unknown as Container);

    this.logger.info('ClashWorld initialized');
  }

  public get gameArea(): GameArea {
    return this._gameArea;
  }
}
