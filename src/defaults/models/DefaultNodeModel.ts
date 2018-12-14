import { DefaultPortModel } from "./DefaultPortModel";
import { merge, filter } from "lodash";
import { NodeModel } from "../../models/NodeModel";
import { Toolkit } from "../../Toolkit";
import { DiagramEngine } from "../../DiagramEngine";

/**
 * @author Dylan Vorster
 */
export class DefaultNodeModel extends NodeModel {
  public name: string;
  public color: string;

  constructor(name: string = "Untitled", color: string = "rgb(0,192,255)") {
    super("default");
    this.name = name;
    this.color = color;
  }

  public addInPort(label: string): DefaultPortModel {
    return this.addPort(new DefaultPortModel(true, Toolkit.UID(), label));
  }

  public addOutPort(label: string): DefaultPortModel {
    return this.addPort(new DefaultPortModel(false, Toolkit.UID(), label));
  }

  public deSerialize(object: any, engine: DiagramEngine) {
    super.deSerialize(object, engine);
    this.name = object.name;
    this.color = object.color;
  }

  public serialize() {
    return merge(super.serialize(), {
      name: this.name,
      color: this.color
    });
  }

  public getInPorts(): DefaultPortModel[] {
    return filter(
      this.ports as { [s: string]: DefaultPortModel },
      portModel => {
        return portModel.in;
      }
    );
  }

  public getOutPorts(): DefaultPortModel[] {
    return filter(
      this.ports as { [s: string]: DefaultPortModel },
      portModel => {
        return !portModel.in;
      }
    );
  }
}
