import { Container, Graphics } from 'pixi.js';
import { Townhall } from './items/townhall.game-object';
import { ArcherTower } from './items/archer-tower.game-object';
import { GameObject } from './interface/game-object.abstract';
import {
  fromScreen,
  GRID_HEIGHT,
  GRID_WIDTH,
  Logger,
  TILE_SIZE,
  toIso,
} from '@coc/utils';

export class TilesContainer extends Container {
  private readonly logger: Logger = new Logger(TilesContainer.name);

  public readonly tileSize = 54;
  public readonly gridWidth = 56;
  public readonly gridHeight = 56;

  private gridGraphics: Graphics;
  public skewFactor = 0.5;
  public currentDraggedObject: any = null;

  constructor() {
    super();

    this.label = 'TilesContainer';
    this.sortableChildren = true;
    this.interactiveChildren = true;
    this.hitArea = null;
    this.cursor = 'default';
    this.x = 0;
    this.y = 0;
    this.eventMode = 'static';
    this.interactive = true;

    this.zIndex = 3;

    this.gridGraphics = new Graphics();
    this.gridGraphics.sortableChildren = true;
    this.addChild(this.gridGraphics);

    this.on('pointerdown', (event) => {
      if (this.currentDraggedObject) {
        this.currentDraggedObject.onDragEnd();
        this.currentDraggedObject = null;
        return;
      }

      const pos = event.getLocalPosition(this);

      const { x, y } = fromScreen(pos.x, pos.y, TILE_SIZE);
      const obj = this.getObjectAtTile(Math.floor(x), Math.floor(y));

      if (obj) {
        this.currentDraggedObject = obj;
        obj.onDragStart(event);
      }
    });

    this.on('pointermove', (event) => {
      if (this.currentDraggedObject) {
        this.currentDraggedObject.onDragMove(event);
      }
    });

    // this.on('pointerup', (event) => {
    //   if (this.currentDraggedObject) {
    //     // this.currentDraggedObject.onDragEnd(event);
    //     this.currentDraggedObject = null;
    //   }
    // });

    // this.drawGrid();

    this.logger.info('TilesContainer initialized');
  }

  public getObjectAtTile(x: number, y: number): any {
    for (const child of this.children) {
      const obj = child as GameObject;
      if (
        typeof obj.tileX === 'number' &&
        typeof obj.tileY === 'number' &&
        typeof obj.tilesWidth === 'number' &&
        typeof obj.tileHeight === 'number'
      ) {
        const left = obj.tileX;
        const top = obj.tileY;
        const right = left + obj.tilesWidth - 1;
        const bottom = top + obj.tileHeight - 1;
        if (x >= left && x <= right && y >= top && y <= bottom) {
          return obj;
        }
      }
    }
    return null;
  }

  public async placeTownhall() {
    const townhall = new Townhall();

    await townhall.init(0, 0, 4, 4);

    this.addChild(townhall);
  }

  public async placeArcher() {
    const archerTower = new ArcherTower();
    await archerTower.init(0, 4, 3, 3);

    this.addChild(archerTower);
  }

  private drawGrid() {
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0x888888, 1);
    for (let x = 0; x <= GRID_WIDTH; x++) {
      const start = toIso({ x, y: 0 });
      const end = toIso({ x, y: GRID_HEIGHT });
      this.gridGraphics.moveTo(start.x, start.y);
      this.gridGraphics.lineTo(end.x, end.y);
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      const start = toIso({ x: 0, y });
      const end = toIso({ x: GRID_WIDTH, y });
      this.gridGraphics.moveTo(start.x, start.y);
      this.gridGraphics.lineTo(end.x, end.y);
    }
    this.gridGraphics.endFill();
  }

  public isPlaceable(obj: GameObject, tileX: number, tileY: number): boolean {
    if (
      tileX < 0 ||
      tileY < 0 ||
      tileX + obj.tilesWidth > GRID_WIDTH ||
      tileY + obj.tileHeight > GRID_HEIGHT
    ) {
      return false;
    }

    for (const child of this.children) {
      if (child === obj || !(child instanceof GameObject)) continue;
      const overlap =
        tileX < child.tileX + child.tilesWidth &&
        tileX + obj.tilesWidth > child.tileX &&
        tileY < child.tileY + child.tileHeight &&
        tileY + obj.tileHeight > child.tileY;
      if (overlap) return false;
    }

    return true;
  }
}
