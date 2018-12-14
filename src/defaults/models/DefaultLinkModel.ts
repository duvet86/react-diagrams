/**
 * @author Dylan Vorster
 */
import { LinkModel, ILinkModelListener } from "../../models/LinkModel";
import { IBaseEvent } from "../../BaseEntity";
import { merge } from "lodash";
import { DiagramEngine } from "../../DiagramEngine";
import { DefaultLabelModel } from "./DefaultLabelModel";
import { LabelModel } from "../../models/LabelModel";

export interface IDefaultLinkModelListener extends ILinkModelListener {
  colorChanged?(event: IBaseEvent & { color: null | string }): void;

  widthChanged?(event: IBaseEvent & { width: 0 | number }): void;
}

export class DefaultLinkModel extends LinkModel<IDefaultLinkModelListener> {
  public curvyness: number;
  public width: number;
  public color: string;

  constructor(type: string = "default") {
    super(type);
    this.color = "rgba(255,255,255,0.5)";
    this.width = 3;
    this.curvyness = 50;
  }

  public serialize() {
    return merge(super.serialize(), {
      width: this.width,
      color: this.color,
      curvyness: this.curvyness
    });
  }

  public deSerialize(ob: any, engine: DiagramEngine) {
    super.deSerialize(ob, engine);
    this.color = ob.color;
    this.width = ob.width;
    this.curvyness = ob.curvyness;
  }

  public addLabel(label: LabelModel | string) {
    if (label instanceof LabelModel) {
      return super.addLabel(label);
    }
    const labelOb = new DefaultLabelModel();
    labelOb.setLabel(label);

    return super.addLabel(labelOb);
  }

  public setWidth(width: number) {
    this.width = width;
    this.iterateListeners(
      (listener: IDefaultLinkModelListener, event: IBaseEvent) => {
        if (listener.widthChanged) {
          listener.widthChanged({ ...event, width });
        }
      }
    );
  }

  public setColor(color: string) {
    this.color = color;
    this.iterateListeners(
      (listener: IDefaultLinkModelListener, event: IBaseEvent) => {
        if (listener.colorChanged) {
          listener.colorChanged({ ...event, color });
        }
      }
    );
  }
}
