import { Container } from 'pixi.js';
import { ClashCore } from './core';
import { GameArea } from '@coc/gamearea';

export class ClashWorld extends Container {
  private core: ClashCore = ClashCore.getInstance();
  private gameArea: GameArea;

  constructor() {
    super();

    this.sortableChildren = true;
    this.interactiveChildren = true;
    this.hitArea = null;
    this.cursor = 'default';

    this.gameArea = new GameArea(this.core);
    this.addChild(this.gameArea as unknown as Container);

    this.core.camera.addChild(this);
  }
}
