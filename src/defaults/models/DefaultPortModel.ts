import { merge } from "lodash";
import { PortModel } from "../../models/PortModel";
import { DiagramEngine } from "../../DiagramEngine";
import { DefaultLinkModel } from "./DefaultLinkModel";
import { LinkModel } from "../../models/LinkModel";

export class DefaultPortModel extends PortModel {
  public in: boolean;
  public label: string;

  constructor(isInput: boolean, name: string, label?: string, id?: string) {
    super(name, "default", id);
    this.in = isInput;
    this.label = label || name;
  }

  public deSerialize(object: any, engine: DiagramEngine) {
    super.deSerialize(object, engine);
    this.in = object.in;
    this.label = object.label;
  }

  public serialize() {
    return merge(super.serialize(), {
      in: this.in,
      label: this.label
    });
  }

  public link(port: PortModel): LinkModel {
    const link = this.createLinkModel();
    link.setSourcePort(this);
    link.setTargetPort(port);

    return link;
  }

  public canLinkToPort(port: PortModel): boolean {
    if (port instanceof DefaultPortModel) {
      return this.in !== port.in;
    }
    return true;
  }

  public createLinkModel(): LinkModel {
    const link = super.createLinkModel();

    return link || new DefaultLinkModel();
  }
}
