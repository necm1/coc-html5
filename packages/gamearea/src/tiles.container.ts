import { Container, Graphics } from 'pixi.js';
import { GameArea } from './gamearea.container';

export class TilesContainer extends Container {
  private tileSize = 45;
  private gridWidth = 56;
  private gridHeight = 56;
  private gridGraphics: Graphics;
  private skewFactor = 0.52;

  constructor(private readonly gamearea: GameArea) {
    super();

    this.label = 'TilesContainer';
    this.sortableChildren = true;
    this.interactiveChildren = true;
    this.hitArea = null;
    this.cursor = 'default';
    this.x = 0;
    this.y = 0;

    this.zIndex = 1;

    this.gridGraphics = new Graphics();
    this.addChild(this.gridGraphics);
  }

  /**
   * Calculate the optimal tileSize so that the isometric bounding box of the grid fits exactly into the game area
   */
  public fitGridToGameArea(
    gridWidth = this.gridWidth,
    gridHeight = this.gridHeight
  ) {
    const areaW = this.gamearea.width;
    const areaH = this.gamearea.height;

    if (areaW <= 0 || areaH <= 0) {
      return;
    }

    const maxTileSizeW = (areaW / (gridWidth + gridHeight)) * 2;
    const maxTileSizeH =
      ((areaH / (gridWidth + gridHeight)) * 2) / this.skewFactor;

    let tileSize = Math.min(maxTileSizeW, maxTileSizeH);

    if (!isFinite(tileSize) || tileSize < 1) {
      tileSize = 1;
    }

    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.tileSize = tileSize;
    this.drawGrid();
    const app = this.gamearea.core.app;
    this.x = app.renderer.width / 2;
    this.y = app.renderer.height / 2;
  }

  private drawGrid() {
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0x888888, 1);

    const p1 = this.toIso(0, 0);
    const p2 = this.toIso(this.gridWidth, 0);
    const p3 = this.toIso(0, this.gridHeight);
    const p4 = this.toIso(this.gridWidth, this.gridHeight);
    const offsetX = (p1.x + p2.x + p3.x + p4.x) / 4;
    const offsetY = (p1.y + p2.y + p3.y + p4.y) / 4;

    for (let x = 0; x <= this.gridWidth; x++) {
      const start = this.toIso(x, 0);
      const end = this.toIso(x, this.gridHeight);
      this.gridGraphics.moveTo(start.x - offsetX, start.y - offsetY);
      this.gridGraphics.lineTo(end.x - offsetX, end.y - offsetY);
    }

    for (let y = 0; y <= this.gridHeight; y++) {
      const start = this.toIso(0, y);
      const end = this.toIso(this.gridWidth, y);
      this.gridGraphics.moveTo(start.x - offsetX, start.y - offsetY);
      this.gridGraphics.lineTo(end.x - offsetX, end.y - offsetY);
    }

    this.gridGraphics.endFill();
  }

  public toIso(x: number, y: number) {
    return {
      x: (x + y) * (this.tileSize / 2),
      y: (y - x) * (this.tileSize / 2) * this.skewFactor,
    };
  }
}
