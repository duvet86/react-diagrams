import {
  IBaseListener,
  BaseEntity,
  IBaseEvent,
  BaseEntityType
} from "../BaseEntity";
import { forEach, merge, map, flatMap, uniq, filter, includes } from "lodash";
import { DiagramEngine } from "../DiagramEngine";
import { LinkModel } from "./LinkModel";
import { NodeModel } from "./NodeModel";
import { PortModel } from "./PortModel";
import { BaseModel, IBaseModelListener } from "./BaseModel";
import { PointModel } from "./PointModel";
/**
 * @author Dylan Vorster
 *
 */
export interface IDiagramListener extends IBaseListener {
  nodesUpdated?(
    event: IBaseEvent & { node: NodeModel; isCreated: boolean }
  ): void;

  linksUpdated?(
    event: IBaseEvent & { link: LinkModel; isCreated: boolean }
  ): void;

  offsetUpdated?(
    event: IBaseEvent & { offsetX: number; offsetY: number }
  ): void;

  zoomUpdated?(event: IBaseEvent & { zoom: number }): void;

  gridUpdated?(event: IBaseEvent & { size: number }): void;
}

export class DiagramModel extends BaseEntity<IDiagramListener> {
  public rendered: boolean;
  // Models.
  public nodes: { [s: string]: NodeModel };
  public links: { [s: string]: LinkModel };

  // Control variables.
  private offsetX: number;
  private offsetY: number;
  private zoom: number;
  private gridSize: number;

  constructor() {
    super();

    this.links = {};
    this.nodes = {};

    this.offsetX = 0;
    this.offsetY = 0;
    this.zoom = 100;
    this.rendered = false;
    this.gridSize = 0;
  }

  public setGridSize(size: number = 0) {
    this.gridSize = size;
    this.iterateListeners((listener, event) => {
      if (listener.gridUpdated) {
        listener.gridUpdated({ ...event, size });
      }
    });
  }

  public getGridPosition(pos: number) {
    if (this.gridSize === 0) {
      return pos;
    }
    return (
      this.gridSize * Math.floor((pos + this.gridSize / 2) / this.gridSize)
    );
  }

  public deSerializeDiagram(object: any, diagramEngine: DiagramEngine) {
    this.deSerialize(object, diagramEngine);

    this.offsetX = object.offsetX;
    this.offsetY = object.offsetY;
    this.zoom = object.zoom;
    this.gridSize = object.gridSize;

    // deserialize nodes
    forEach(object.nodes, (node: any) => {
      const nodeOb = diagramEngine
        .getNodeFactory(node.type)
        .getNewInstance(node);
      nodeOb.setParent(this);
      nodeOb.deSerialize(node, diagramEngine);
      this.addNode(nodeOb);
    });

    // deserialze links
    forEach(object.links, (link: any) => {
      const linkOb = diagramEngine.getLinkFactory(link.type).getNewInstance();
      linkOb.setParent(this);
      linkOb.deSerialize(link, diagramEngine);
      this.addLink(linkOb);
    });
  }

  public serializeDiagram() {
    return merge(this.serialize(), {
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      zoom: this.zoom,
      gridSize: this.gridSize,
      links: map(this.links, link => {
        return link.serialize();
      }),
      nodes: map(this.nodes, node => {
        return node.serialize();
      })
    });
  }

  public clearSelection(
    ignore: BaseModel<BaseEntity, IBaseModelListener> | null = null
  ) {
    forEach(this.getSelectedItems(), element => {
      if (ignore && ignore.getID() === element.getID()) {
        return;
      }
      element.setSelected(false); // TODO dont fire the listener
    });
  }

  public getSelectedItems(
    ...filters: BaseEntityType[]
  ): Array<BaseModel<BaseEntity, IBaseModelListener>> {
    if (!Array.isArray(filters)) {
      filters = [filters];
    }
    let items: Array<BaseModel<BaseEntity, IBaseModelListener>> = [];

    // Run through nodes.
    items = items.concat(
      flatMap(this.nodes, node => {
        return node.getSelectedEntities();
      })
    );

    // Find all the links.
    items = items.concat(
      flatMap(this.links, link => {
        return link.getSelectedEntities();
      })
    );

    // Find all points.
    items = items.concat(
      flatMap(this.links, link => {
        return flatMap(link.points, point => {
          return point.getSelectedEntities();
        });
      })
    );

    items = uniq(items);

    if (filters.length > 0) {
      items = filter(uniq(items), (item: BaseModel<any>) => {
        if (includes(filters, "node") && item instanceof NodeModel) {
          return true;
        }
        if (includes(filters, "link") && item instanceof LinkModel) {
          return true;
        }
        if (includes(filters, "port") && item instanceof PortModel) {
          return true;
        }
        if (includes(filters, "point") && item instanceof PointModel) {
          return true;
        }
        return false;
      });
    }

    return items;
  }

  public setZoomLevel(zoom: number) {
    this.zoom = zoom;

    this.iterateListeners((listener, event) => {
      if (listener.zoomUpdated) {
        listener.zoomUpdated({ ...event, zoom });
      }
    });
  }

  public setOffset(offsetX: number, offsetY: number) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.iterateListeners((listener, event) => {
      if (listener.offsetUpdated) {
        listener.offsetUpdated({
          ...event,
          offsetX,
          offsetY
        });
      }
    });
  }

  public setOffsetX(offsetX: number) {
    this.offsetX = offsetX;
    this.iterateListeners((listener, event) => {
      if (listener.offsetUpdated) {
        listener.offsetUpdated({
          ...event,
          offsetX,
          offsetY: this.offsetY
        });
      }
    });
  }

  public setOffsetY(offsetY: number) {
    this.offsetY = offsetY;

    this.iterateListeners((listener, event) => {
      if (listener.offsetUpdated) {
        listener.offsetUpdated({
          ...event,
          offsetX: this.offsetX,
          offsetY: this.offsetY
        });
      }
    });
  }

  public getOffsetY() {
    return this.offsetY;
  }

  public getOffsetX() {
    return this.offsetX;
  }

  public getZoomLevel() {
    return this.zoom;
  }

  public getNode(node: string | NodeModel): NodeModel | null {
    if (node instanceof NodeModel) {
      return node;
    }
    if (!this.nodes[node]) {
      return null;
    }
    return this.nodes[node];
  }

  public getLink(link: string | LinkModel): LinkModel | null {
    if (link instanceof LinkModel) {
      return link;
    }
    if (!this.links[link]) {
      return null;
    }
    return this.links[link];
  }

  public addAll(...models: BaseModel[]): BaseModel[] {
    forEach(models, model => {
      if (model instanceof LinkModel) {
        this.addLink(model);
      } else if (model instanceof NodeModel) {
        this.addNode(model);
      }
    });
    return models;
  }

  public addLink(link: LinkModel): LinkModel {
    link.addListener({
      entityRemoved: () => {
        this.removeLink(link);
      }
    });
    this.links[link.getID()] = link;
    this.iterateListeners((listener, event) => {
      if (listener.linksUpdated) {
        listener.linksUpdated({ ...event, link, isCreated: true });
      }
    });
    return link;
  }

  public addNode(node: NodeModel): NodeModel {
    node.addListener({
      entityRemoved: () => {
        this.removeNode(node);
      }
    });
    this.nodes[node.getID()] = node;
    this.iterateListeners((listener, event) => {
      if (listener.nodesUpdated) {
        listener.nodesUpdated({ ...event, node, isCreated: true });
      }
    });
    return node;
  }

  public removeLink(link: LinkModel | string) {
    const tempLink = this.getLink(link);
    if (tempLink == null) {
      throw new Error();
    }

    delete this.links[tempLink.getID()];
    this.iterateListeners((listener, event) => {
      if (listener.linksUpdated) {
        listener.linksUpdated({
          ...event,
          link: link as LinkModel,
          isCreated: false
        });
      }
    });
  }

  public removeNode(node: NodeModel | string) {
    const tempNode = this.getNode(node);
    if (tempNode == null) {
      throw new Error();
    }

    delete this.nodes[tempNode.getID()];
    this.iterateListeners((listener, event) => {
      if (listener.nodesUpdated) {
        listener.nodesUpdated({
          ...event,
          node: node as NodeModel,
          isCreated: false
        });
      }
    });
  }

  public getLinks(): { [s: string]: LinkModel } {
    return this.links;
  }

  public getNodes(): { [s: string]: NodeModel } {
    return this.nodes;
  }
}
