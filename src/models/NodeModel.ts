import { BaseModel, IBaseModelListener } from "./BaseModel";
import { PortModel } from "./PortModel";
import { forEach, merge, map } from "lodash";
import { DiagramEngine } from "../DiagramEngine";
import { DiagramModel } from "./DiagramModel";
import { PointModel } from "../models/PointModel";

export class NodeModel extends BaseModel<DiagramModel, IBaseModelListener> {
  public x: number;
  public y: number;
  // Calculated post rendering so routing can be done correctly.
  public width: number = 0;
  public height: number = 0;

  public extras: any;
  public ports: { [s: string]: PortModel };

  constructor(nodeType: string = "default", id?: string) {
    super(nodeType, id);
    this.x = 0;
    this.y = 0;
    this.extras = {};
    this.ports = {};
  }

  public setPosition(x: number, y: number) {
    // Store position
    const oldX = this.x;
    const oldY = this.y;
    forEach(this.ports, port => {
      forEach(port.getLinks(), link => {
        const point = link.getPointForPort(port);
        if (point != null) {
          point.x = point.x + x - oldX;
          point.y = point.y + y - oldY;
        }
      });
    });
    this.x = x;
    this.y = y;
  }

  public getSelectedEntities() {
    let entities = super.getSelectedEntities();

    // add the points of each link that are selected here
    if (this.isSelected()) {
      forEach(this.ports, port => {
        const links = port.getLinks();
        entities = entities.concat(
          Object.keys(links).reduce(
            (res, key) => {
              const pointForPort = links[key].getPointForPort(port);
              if (pointForPort != null) {
                res.push(pointForPort);
              }
              return res;
            },
            [] as PointModel[]
          )
        );
      });
    }

    return entities;
  }

  public deSerialize(ob: any, engine: DiagramEngine) {
    super.deSerialize(ob, engine);
    this.x = ob.x;
    this.y = ob.y;
    this.extras = ob.extras;

    // Deserialize ports.
    forEach(ob.ports, (port: PortModel) => {
      if (port.type != null) {
        const portOb = engine.getPortFactory(port.type).getNewInstance();
        portOb.deSerialize(port, engine);
        this.addPort(portOb);
      }
    });
  }

  public serialize() {
    return merge(super.serialize(), {
      x: this.x,
      y: this.y,
      extras: this.extras,
      ports: map(this.ports, port => {
        return port.serialize();
      })
    });
  }

  public doClone(lookupTable = {}, clone: any) {
    // also clone the ports
    clone.ports = {};
    forEach(this.ports, port => {
      clone.addPort(port.clone(lookupTable));
    });
  }

  public remove() {
    super.remove();
    forEach(this.ports, port => {
      forEach(port.getLinks(), link => {
        link.remove();
      });
    });
  }

  public getPortFromID(id: string): PortModel | null {
    for (const i in this.ports) {
      if (this.ports[i].id === id) {
        return this.ports[i];
      }
    }
    return null;
  }

  public getPort(name: string): PortModel {
    return this.ports[name];
  }

  public getPorts(): { [s: string]: PortModel } {
    return this.ports;
  }

  public removePort(port: PortModel) {
    // Clear the parent node reference.
    if (this.ports[port.name]) {
      this.ports[port.name].removeParent();
      delete this.ports[port.name];
    }
  }

  public addPort<T extends PortModel>(port: T): T {
    port.setParent(this);
    this.ports[port.name] = port;
    return port;
  }

  public updateDimensions({
    width,
    height
  }: {
    width: number;
    height: number;
  }) {
    this.width = width;
    this.height = height;
  }
}
