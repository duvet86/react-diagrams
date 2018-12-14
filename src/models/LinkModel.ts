import { BaseModel, IBaseModelListener } from "./BaseModel";
import { PortModel } from "./PortModel";
import { PointModel } from "./PointModel";
import { map, forEach, merge } from "lodash";
import { IBaseEvent } from "../BaseEntity";
import { LabelModel } from "./LabelModel";
import { DiagramEngine } from "../DiagramEngine";
import { DiagramModel } from "./DiagramModel";

export interface ILinkModelListener extends IBaseModelListener {
  sourcePortChanged?(event: IBaseEvent & { port: null | PortModel }): void;

  targetPortChanged?(event: IBaseEvent & { port: null | PortModel }): void;
}

export class LinkModel<
  T extends ILinkModelListener = ILinkModelListener
> extends BaseModel<DiagramModel, T> {
  public points: PointModel[];
  public sourcePort: PortModel | null;
  public targetPort: PortModel | null;
  public labels: LabelModel[];
  public extras: any;

  constructor(linkType: string = "default", id?: string) {
    super(linkType, id);
    this.points = [
      new PointModel(this, { x: 0, y: 0 }),
      new PointModel(this, { x: 0, y: 0 })
    ];
    this.extras = {};
    this.sourcePort = null;
    this.targetPort = null;
    this.labels = [];
  }

  public deSerialize(ob: any, engine: DiagramEngine) {
    super.deSerialize(ob, engine);
    this.extras = ob.extras;
    this.points = map(ob.points || [], (point: { x: any; y: any }) => {
      const p = new PointModel(this, { x: point.x, y: point.y });
      p.deSerialize(point, engine);
      return p;
    });

    // Deserialize labels.
    forEach(ob.labels || [], (label: any) => {
      const labelOb = engine.getLabelFactory(label.type).getNewInstance();
      labelOb.deSerialize(label, engine);
      this.addLabel(labelOb);
    });

    const parent = this.getParent();
    if (parent == null) {
      return;
    }

    if (ob.target) {
      const node = parent.getNode(ob.target);
      if (node == null) {
        return;
      }
      const portFromId = node.getPortFromID(ob.targetPort);
      if (portFromId == null) {
        return;
      }

      this.setTargetPort(portFromId);
    }

    if (ob.source) {
      const node = parent.getNode(ob.source);
      if (node == null) {
        return;
      }
      const portFromId = node.getPortFromID(ob.sourcePort);
      if (portFromId == null) {
        return;
      }

      this.setSourcePort(portFromId);
    }
  }

  public serialize() {
    return merge(super.serialize(), {
      source:
        this.sourcePort && this.sourcePort.getParent()
          ? this.sourcePort.getParent()!.id
          : null,
      sourcePort: this.sourcePort ? this.sourcePort.id : null,
      target:
        this.targetPort && this.targetPort.getParent()
          ? this.targetPort.getParent()!.id
          : null,
      targetPort: this.targetPort ? this.targetPort.id : null,
      points: map(this.points, point => {
        return point.serialize();
      }),
      extras: this.extras,
      labels: map(this.labels, label => {
        return label.serialize();
      })
    });
  }

  public doClone(lookupTable = {}, clone: any) {
    clone.setPoints(
      map(this.getPoints(), (point: PointModel) => {
        return point.clone(lookupTable);
      })
    );
    if (this.sourcePort) {
      clone.setSourcePort(this.sourcePort.clone(lookupTable));
    }
    if (this.targetPort) {
      clone.setTargetPort(this.targetPort.clone(lookupTable));
    }
  }

  public remove() {
    if (this.sourcePort) {
      this.sourcePort.removeLink(this);
    }
    if (this.targetPort) {
      this.targetPort.removeLink(this);
    }
    super.remove();
  }

  public isLastPoint(point: PointModel) {
    const index = this.getPointIndex(point);
    return index === this.points.length - 1;
  }

  public getPointIndex(point: PointModel) {
    return this.points.indexOf(point);
  }

  public getPointModel(id: string): PointModel | null {
    for (const point of this.points) {
      if (point.id === id) {
        return point;
      }
    }
    return null;
  }

  public getPortForPoint(point: PointModel): PortModel | null {
    if (
      this.sourcePort !== null &&
      this.getFirstPoint().getID() === point.getID()
    ) {
      return this.sourcePort;
    }

    if (
      this.targetPort !== null &&
      this.getLastPoint().getID() === point.getID()
    ) {
      return this.targetPort;
    }

    return null;
  }

  public getPointForPort(port: PortModel): PointModel | null {
    if (this.sourcePort !== null && this.sourcePort.getID() === port.getID()) {
      return this.getFirstPoint();
    }

    if (this.targetPort !== null && this.targetPort.getID() === port.getID()) {
      return this.getLastPoint();
    }

    return null;
  }

  public getFirstPoint(): PointModel {
    return this.points[0];
  }

  public getLastPoint(): PointModel {
    return this.points[this.points.length - 1];
  }

  public setSourcePort(port: PortModel) {
    if (port !== null) {
      port.addLink(this);
    }
    if (this.sourcePort !== null) {
      this.sourcePort.removeLink(this);
    }
    this.sourcePort = port;
    this.iterateListeners((listener: ILinkModelListener, event) => {
      if (listener.sourcePortChanged) {
        listener.sourcePortChanged({ ...event, port });
      }
    });
  }

  public getSourcePort(): PortModel | null {
    return this.sourcePort;
  }

  public getTargetPort(): PortModel | null {
    return this.targetPort;
  }

  public setTargetPort(port: PortModel | null) {
    if (port !== null) {
      port.addLink(this);
    }
    if (this.targetPort !== null) {
      this.targetPort.removeLink(this);
    }
    this.targetPort = port;
    this.iterateListeners((listener: ILinkModelListener, event) => {
      if (listener.targetPortChanged) {
        listener.targetPortChanged({ ...event, port });
      }
    });
  }

  public point(x: number, y: number): PointModel {
    return this.addPoint(this.generatePoint(x, y));
  }

  public addLabel(label: LabelModel) {
    label.setParent(this);
    this.labels.push(label);
  }

  public getPoints(): PointModel[] {
    return this.points;
  }

  public setPoints(points: PointModel[]) {
    forEach(points, point => {
      point.setParent(this);
    });
    this.points = points;
  }

  public removePoint(pointModel: PointModel) {
    this.points.splice(this.getPointIndex(pointModel), 1);
  }

  public removePointsBefore(pointModel: PointModel) {
    this.points.splice(0, this.getPointIndex(pointModel));
  }

  public removePointsAfter(pointModel: PointModel) {
    this.points.splice(this.getPointIndex(pointModel) + 1);
  }

  public removeMiddlePoints() {
    if (this.points.length > 2) {
      this.points.splice(0, this.points.length - 2);
    }
  }

  public addPoint<P extends PointModel>(pointModel: P, index = 1): P {
    pointModel.setParent(this);
    this.points.splice(index, 0, pointModel);
    return pointModel;
  }

  public generatePoint(x: number = 0, y: number = 0): PointModel {
    return new PointModel(this, { x, y });
  }
}
