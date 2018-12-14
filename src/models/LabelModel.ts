import { BaseModel } from "./BaseModel";
import { LinkModel } from "./LinkModel";
import { merge } from "lodash";
import { DiagramEngine } from "../DiagramEngine";

export class LabelModel extends BaseModel<LinkModel> {
  public offsetX: number;
  public offsetY: number;

  constructor(type?: string, id?: string) {
    super(type, id);
    this.offsetX = 0;
    this.offsetY = 0;
  }

  public deSerialize(ob: any, engine: DiagramEngine) {
    super.deSerialize(ob, engine);
    this.offsetX = ob.offsetX;
    this.offsetY = ob.offsetY;
  }

  public serialize() {
    return merge(super.serialize(), {
      offsetX: this.offsetX,
      offsetY: this.offsetY
    });
  }
}
