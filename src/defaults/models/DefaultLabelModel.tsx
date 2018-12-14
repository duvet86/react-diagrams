import { LabelModel } from "../../models/LabelModel";
import { merge } from "lodash";
import { DiagramEngine } from "../../DiagramEngine";

export class DefaultLabelModel extends LabelModel {
  public label: string | undefined;

  constructor() {
    super("default");
    this.offsetY = -23;
  }

  public setLabel(label: string) {
    this.label = label;
  }

  public deSerialize(ob: any, engine: DiagramEngine) {
    super.deSerialize(ob, engine);
    this.label = ob.label;
  }

  public serialize() {
    return merge(super.serialize(), {
      label: this.label
    });
  }
}
