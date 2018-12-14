import { BaseAction } from "./BaseAction";
import { DiagramModel } from "../models/DiagramModel";

export class SelectingAction extends BaseAction {
  public mouseX2: number;
  public mouseY2: number;

  constructor(mouseX: number, mouseY: number) {
    super(mouseX, mouseY);
    this.mouseX2 = mouseX;
    this.mouseY2 = mouseY;
  }

  public getBoxDimensions() {
    return {
      left: this.mouseX2 > this.mouseX ? this.mouseX : this.mouseX2,
      top: this.mouseY2 > this.mouseY ? this.mouseY : this.mouseY2,
      width: Math.abs(this.mouseX2 - this.mouseX),
      height: Math.abs(this.mouseY2 - this.mouseY),
      right: this.mouseX2 < this.mouseX ? this.mouseX : this.mouseX2,
      bottom: this.mouseY2 < this.mouseY ? this.mouseY : this.mouseY2
    };
  }

  public containsElement(
    x: number,
    y: number,
    diagramModel: DiagramModel
  ): boolean {
    const z = diagramModel.getZoomLevel() / 100.0;
    const dimensions = this.getBoxDimensions();

    return (
      x * z + diagramModel.getOffsetX() > dimensions.left &&
      x * z + diagramModel.getOffsetX() < dimensions.right &&
      y * z + diagramModel.getOffsetY() > dimensions.top &&
      y * z + diagramModel.getOffsetY() < dimensions.bottom
    );
  }
}
