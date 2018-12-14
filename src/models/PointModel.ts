import { BaseModel, IBaseModelListener } from "./BaseModel";
import { LinkModel } from "./LinkModel";
import { merge } from "lodash";
import { DiagramEngine } from "../DiagramEngine";

export class PointModel extends BaseModel<LinkModel, IBaseModelListener> {
  public x: number;
  public y: number;

  constructor(link: LinkModel, points: { x: number; y: number }) {
    super();
    this.x = points.x;
    this.y = points.y;
    this.parent = link;
  }

  public getSelectedEntities() {
    if (super.isSelected() && !this.isConnectedToPort()) {
      return [this];
    }
    return [];
  }

  public isConnectedToPort(): boolean {
    return (this.parent && this.parent.getPortForPoint(this)) !== null;
  }

  public getLink(): LinkModel | undefined {
    return this.getParent();
  }

  public deSerialize(ob: any, engine: DiagramEngine) {
    super.deSerialize(ob, engine);
    this.x = ob.x;
    this.y = ob.y;
  }

  public serialize() {
    return merge(super.serialize(), {
      x: this.x,
      y: this.y
    });
  }

  public remove() {
    // Clear references.
    if (this.parent) {
      this.parent.removePoint(this);
    }
    super.remove();
  }

  public updateLocation(points: { x: number; y: number }) {
    this.x = points.x;
    this.y = points.y;
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public isLocked() {
    const parent = this.getParent();
    return super.isLocked() || ((parent && parent.isLocked()) || false);
  }
}
