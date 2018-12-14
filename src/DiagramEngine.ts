import { BaseEntity, IBaseListener } from "./BaseEntity";
import { DiagramModel } from "./models/DiagramModel";
import {
  forEach,
  range,
  cloneDeep,
  values,
  flatMap,
  minBy,
  maxBy,
  concat
} from "lodash";
import { BaseModel, IBaseModelListener } from "./models/BaseModel";
import { NodeModel } from "./models/NodeModel";
import { PointModel } from "./models/PointModel";
import { PortModel } from "./models/PortModel";
import { LinkModel } from "./models/LinkModel";
import { AbstractLabelFactory } from "./factories/AbstractLabelFactory";
import { AbstractLinkFactory } from "./factories/AbstractLinkFactory";
import { AbstractNodeFactory } from "./factories/AbstractNodeFactory";
import { AbstractPortFactory } from "./factories/AbstractPortFactory";
import { DefaultLinkFactory, DefaultNodeFactory } from "./main";
import { ROUTING_SCALING_FACTOR } from "./routing/PathFinding";
import { DefaultPortFactory } from "./defaults/factories/DefaultPortFactory";
import { LabelModel } from "./models/LabelModel";
import { DefaultLabelFactory } from "./defaults/factories/DefaultLabelFactory";
import { Toolkit } from "./Toolkit";
/**
 * @author Dylan Vorster
 */
export interface IDiagramEngineListener extends IBaseListener {
  portFactoriesUpdated?(): void;
  nodeFactoriesUpdated?(): void;
  linkFactoriesUpdated?(): void;
  labelFactoriesUpdated?(): void;
  repaintCanvas?(): void;
}

/**
 * Passed as a parameter to the DiagramWidget
 */
export class DiagramEngine extends BaseEntity<IDiagramEngineListener> {
  public diagramModel: DiagramModel;
  public linksThatHaveInitiallyRendered: { [id: string]: boolean } = {};
  public canvas: HTMLElement | null;
  public nodesRendered: boolean | undefined;

  private nodeFactories: { [s: string]: AbstractNodeFactory };
  private linkFactories: { [s: string]: AbstractLinkFactory };
  private portFactories: { [s: string]: AbstractPortFactory };
  private labelFactories: { [s: string]: AbstractLabelFactory };

  private paintableWidgets: { [id: string]: boolean } | null;
  private maxNumberPointsPerLink?: number;
  private smartRouting?: boolean;

  // calculated only when smart routing is active
  private canvasMatrix: number[][] = [];
  private routingMatrix: number[][] = [];
  // used when at least one element has negative coordinates
  private hAdjustmentFactor: number = 0;
  private vAdjustmentFactor: number = 0;

  constructor() {
    super();
    this.diagramModel = new DiagramModel();
    this.nodeFactories = {};
    this.linkFactories = {};
    this.portFactories = {};
    this.labelFactories = {};
    this.canvas = null;
    this.paintableWidgets = null;
    this.linksThatHaveInitiallyRendered = {};

    if (Toolkit.TESTING) {
      Toolkit.TESTING_UID = 0;

      // Pop it onto the window so our E2E helpers can find it.
      if (window) {
        (window as any).diagram_instance = this;
      }
    }
  }

  public installDefaultFactories() {
    this.registerNodeFactory(new DefaultNodeFactory());
    this.registerLinkFactory(new DefaultLinkFactory());
    this.registerPortFactory(new DefaultPortFactory());
    this.registerLabelFactory(new DefaultLabelFactory());
  }

  public repaintCanvas() {
    this.iterateListeners(listener => {
      if (listener.repaintCanvas) {
        listener.repaintCanvas();
      }
    });
  }

  public clearRepaintEntities() {
    this.paintableWidgets = null;
  }

  public enableRepaintEntities(
    entities: Array<BaseModel<BaseEntity, IBaseModelListener>>
  ) {
    this.paintableWidgets = {};
    entities.forEach(entity => {
      // If a node is requested to repaint, add all of its links.
      if (entity instanceof NodeModel) {
        forEach(entity.getPorts(), port => {
          forEach(port.getLinks(), link => {
            this.paintableWidgets![link.getID()] = true;
          });
        });
      }

      if (entity instanceof PointModel && entity.getLink() != null) {
        this.paintableWidgets![entity.getLink()!.getID()] = true;
      }

      this.paintableWidgets![entity.getID()] = true;
    });
  }

  /**
   * Checks to see if a model is locked by running through
   * its parents to see if they are locked first
   */
  public isModelLocked(model: BaseEntity<IBaseListener>) {
    // Always check the diagram model.
    if (this.diagramModel.isLocked()) {
      return true;
    }

    return model.isLocked();
  }

  public recalculatePortsVisually() {
    this.nodesRendered = false;
    this.linksThatHaveInitiallyRendered = {};
  }

  public canEntityRepaint(
    baseModel: BaseModel<BaseEntity, IBaseModelListener>
  ) {
    // No rules applied, allow repaint.
    if (this.paintableWidgets === null) {
      return true;
    }

    return this.paintableWidgets[baseModel.getID()] !== undefined;
  }

  public setCanvas(canvas: HTMLElement | null) {
    this.canvas = canvas;
  }

  public setDiagramModel(model: DiagramModel) {
    this.diagramModel = model;
    this.recalculatePortsVisually();
  }

  public getDiagramModel(): DiagramModel {
    return this.diagramModel;
  }

  // !-------------- FACTORIES ------------

  public getNodeFactories(): { [s: string]: AbstractNodeFactory } {
    return this.nodeFactories;
  }

  public getLinkFactories(): { [s: string]: AbstractLinkFactory } {
    return this.linkFactories;
  }

  public getLabelFactories(): { [s: string]: AbstractLabelFactory } {
    return this.labelFactories;
  }

  public registerLabelFactory(factory: AbstractLabelFactory) {
    this.labelFactories[factory.getType()] = factory;
    this.iterateListeners(listener => {
      if (listener.labelFactoriesUpdated) {
        listener.labelFactoriesUpdated();
      }
    });
  }

  public registerPortFactory(factory: AbstractPortFactory) {
    this.portFactories[factory.getType()] = factory;
    this.iterateListeners(listener => {
      if (listener.portFactoriesUpdated) {
        listener.portFactoriesUpdated();
      }
    });
  }

  public registerNodeFactory(factory: AbstractNodeFactory) {
    this.nodeFactories[factory.getType()] = factory;
    this.iterateListeners(listener => {
      if (listener.nodeFactoriesUpdated) {
        listener.nodeFactoriesUpdated();
      }
    });
  }

  public registerLinkFactory(factory: AbstractLinkFactory) {
    this.linkFactories[factory.getType()] = factory;
    this.iterateListeners(listener => {
      if (listener.linkFactoriesUpdated) {
        listener.linkFactoriesUpdated();
      }
    });
  }

  public getPortFactory(type: string): AbstractPortFactory {
    if (this.portFactories[type]) {
      return this.portFactories[type];
    }
    throw new Error(`cannot find factory for port of type: [${type}]`);
  }

  public getNodeFactory(type: string): AbstractNodeFactory {
    if (this.nodeFactories[type]) {
      return this.nodeFactories[type];
    }
    throw new Error(`cannot find factory for node of type: [${type}]`);
  }

  public getLinkFactory(type: string): AbstractLinkFactory {
    if (this.linkFactories[type]) {
      return this.linkFactories[type];
    }
    throw new Error(`cannot find factory for link of type: [${type}]`);
  }

  public getLabelFactory(type: string): AbstractLabelFactory {
    if (this.labelFactories[type]) {
      return this.labelFactories[type];
    }
    throw new Error(`cannot find factory for label of type: [${type}]`);
  }

  public getFactoryForNode(node: NodeModel): AbstractNodeFactory | null {
    const type = node.getType();
    if (type == null) {
      return null;
    }

    return this.getNodeFactory(type);
  }

  public getFactoryForLink(link: LinkModel): AbstractLinkFactory | null {
    const type = link.getType();
    if (type == null) {
      return null;
    }

    return this.getLinkFactory(type);
  }

  public getFactoryForLabel(label: LabelModel): AbstractLabelFactory | null {
    const type = label.getType();
    if (type == null) {
      return null;
    }

    return this.getLabelFactory(type);
  }

  public generateWidgetForLink(link: LinkModel): JSX.Element | null {
    const linkFactory = this.getFactoryForLink(link);
    if (!linkFactory) {
      throw new Error("Cannot find link factory for link: " + link.getType());
    }
    return linkFactory.generateReactWidget(this, link);
  }

  public generateWidgetForNode(node: NodeModel): JSX.Element | null {
    const nodeFactory = this.getFactoryForNode(node);
    if (!nodeFactory) {
      throw new Error("Cannot find widget factory for node: " + node.getType());
    }
    return nodeFactory.generateReactWidget(this, node);
  }

  public getRelativeMousePoint(
    event: React.MouseEvent
  ): { x: number; y: number } {
    const point = this.getRelativePoint(event.clientX, event.clientY);
    return {
      x:
        (point.x - this.diagramModel.getOffsetX()) /
        (this.diagramModel.getZoomLevel() / 100.0),
      y:
        (point.y - this.diagramModel.getOffsetY()) /
        (this.diagramModel.getZoomLevel() / 100.0)
    };
  }

  public getRelativePoint(x: number, y: number) {
    if (this.canvas == null) {
      throw new Error();
    }

    const canvasRect = this.canvas.getBoundingClientRect();

    return { x: x - canvasRect.left, y: y - canvasRect.top };
  }

  public getNodeElement(node: NodeModel): Element {
    if (this.canvas == null) {
      throw new Error();
    }

    const selector = this.canvas.querySelector(
      `.node[data-nodeid="${node.getID()}"]`
    );
    if (selector === null) {
      throw new Error(
        "Cannot find Node element with nodeID: [" + node.getID() + "]"
      );
    }
    return selector;
  }

  public getNodePortElement(port: PortModel): any {
    const parent = port.getParent();
    if (this.canvas == null || parent == null) {
      throw new Error();
    }

    const selector = this.canvas.querySelector(
      `.port[data-name="${port.getName()}"][data-nodeid="${parent.getID()}"]`
    );
    if (selector === null) {
      throw new Error(
        "Cannot find Node Port element with nodeID: [" +
          parent.getID() +
          "] and name: [" +
          port.getName() +
          "]"
      );
    }
    return selector;
  }

  public getPortCenter(port: PortModel) {
    const sourceElement = this.getNodePortElement(port);
    const sourceRect = sourceElement.getBoundingClientRect();

    const rel = this.getRelativePoint(sourceRect.left, sourceRect.top);

    return {
      x:
        sourceElement.offsetWidth / 2 +
        (rel.x - this.diagramModel.getOffsetX()) /
          (this.diagramModel.getZoomLevel() / 100.0),
      y:
        sourceElement.offsetHeight / 2 +
        (rel.y - this.diagramModel.getOffsetY()) /
          (this.diagramModel.getZoomLevel() / 100.0)
    };
  }

  /**
   * Calculate rectangular coordinates of the port passed in.
   */
  public getPortCoords(
    port: PortModel
  ): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (this.canvas == null) {
      throw new Error();
    }

    const sourceElement = this.getNodePortElement(port);
    const sourceRect = sourceElement.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect() as ClientRect;

    return {
      x:
        (sourceRect.x - this.diagramModel.getOffsetX()) /
          (this.diagramModel.getZoomLevel() / 100.0) -
        canvasRect.left,
      y:
        (sourceRect.y - this.diagramModel.getOffsetY()) /
          (this.diagramModel.getZoomLevel() / 100.0) -
        canvasRect.top,
      width: sourceRect.width,
      height: sourceRect.height
    };
  }

  /**
   * Determine the width and height of the node passed in.
   * It currently assumes nodes have a rectangular shape, can be overriden for customised shapes.
   */
  public getNodeDimensions(node: NodeModel): { width: number; height: number } {
    if (!this.canvas) {
      return {
        width: 0,
        height: 0
      };
    }

    const nodeElement = this.getNodeElement(node);
    const nodeRect = nodeElement.getBoundingClientRect();

    return {
      width: nodeRect.width,
      height: nodeRect.height
    };
  }

  public getMaxNumberPointsPerLink(): number {
    return this.maxNumberPointsPerLink || Infinity;
  }

  public setMaxNumberPointsPerLink(max: number) {
    this.maxNumberPointsPerLink = max;
  }

  public isSmartRoutingEnabled() {
    return !!this.smartRouting;
  }
  public setSmartRoutingStatus(status: boolean) {
    this.smartRouting = status;
  }

  /**
   * A representation of the canvas in the following format:
   *
   * +-----------------+
   * | 0 0 0 0 0 0 0 0 |
   * | 0 0 0 0 0 0 0 0 |
   * | 0 0 0 0 0 0 0 0 |
   * | 0 0 0 0 0 0 0 0 |
   * | 0 0 0 0 0 0 0 0 |
   * +-----------------+
   *
   * In which all walkable points are marked by zeros.
   * It uses @link{#ROUTING_SCALING_FACTOR} to reduce the matrix dimensions and improve performance.
   */
  public getCanvasMatrix(): number[][] {
    if (this.canvasMatrix.length === 0) {
      this.calculateCanvasMatrix();
    }

    return this.canvasMatrix;
  }
  public calculateCanvasMatrix() {
    const {
      width: canvasWidth,
      hAdjustmentFactor,
      height: canvasHeight,
      vAdjustmentFactor
    } = this.calculateMatrixDimensions();

    this.hAdjustmentFactor = hAdjustmentFactor;
    this.vAdjustmentFactor = vAdjustmentFactor;

    const matrixWidth = Math.ceil(canvasWidth / ROUTING_SCALING_FACTOR);
    const matrixHeight = Math.ceil(canvasHeight / ROUTING_SCALING_FACTOR);

    this.canvasMatrix = range(0, matrixHeight).map(() => {
      return new Array(matrixWidth).fill(0);
    });
  }

  /**
   * A representation of the canvas in the following format:
   *
   * +-----------------+
   * | 0 0 1 1 0 0 0 0 |
   * | 0 0 1 1 0 0 1 1 |
   * | 0 0 0 0 0 0 1 1 |
   * | 1 1 0 0 0 0 0 0 |
   * | 1 1 0 0 0 0 0 0 |
   * +-----------------+
   *
   * In which all points blocked by a node (and its ports) are
   * marked as 1; points were there is nothing (ie, free) receive 0.
   */
  public getRoutingMatrix(): number[][] {
    if (this.routingMatrix.length === 0) {
      this.calculateRoutingMatrix();
    }

    return this.routingMatrix;
  }

  public calculateRoutingMatrix(): void {
    const matrix = cloneDeep(this.getCanvasMatrix());

    // nodes need to be marked as blocked points
    this.markNodes(matrix);
    // same thing for ports
    this.markPorts(matrix);

    this.routingMatrix = matrix;
  }

  /**
   * The routing matrix does not have negative indexes, but elements could be negatively positioned.
   * We use the functions below to translate back and forth between these coordinates, relying on the
   * calculated values of hAdjustmentFactor and vAdjustmentFactor.
   */
  public translateRoutingX(x: number, reverse: boolean = false) {
    return x + this.hAdjustmentFactor * (reverse ? -1 : 1);
  }
  public translateRoutingY(y: number, reverse: boolean = false) {
    return y + this.vAdjustmentFactor * (reverse ? -1 : 1);
  }

  /**
   * Despite being a long method, we simply iterate over all three collections (nodes, ports and points)
   * to find the highest X and Y dimensions, so we can build the matrix large enough to contain all elements.
   */
  public calculateMatrixDimensions = (): {
    width: number;
    hAdjustmentFactor: number;
    height: number;
    vAdjustmentFactor: number;
  } => {
    const allNodesCoords = values(this.diagramModel.nodes).map(item => ({
      x: item.x,
      width: item.width,
      y: item.y,
      height: item.height
    }));

    const allLinks = values(this.diagramModel.links);
    const allPortsCoords = flatMap(
      allLinks.map(link => [link.sourcePort, link.targetPort])
    )
      .filter((port: PortModel | null): port is PortModel => port !== null)
      .map(item => ({
        x: item.x,
        width: item.width,
        y: item.y,
        height: item.height
      }));
    const allPointsCoords = flatMap(allLinks.map(link => link.points)).map(
      item => ({
        // points don't have width/height, so let's just use 0
        x: item.x,
        width: 0,
        y: item.y,
        height: 0
      })
    );

    const canvas = this.canvas as HTMLDivElement;

    const minXBy = minBy(
      concat(allNodesCoords, allPortsCoords, allPointsCoords),
      item => item.x
    );
    if (minXBy == null) {
      throw new Error();
    }

    const minX =
      Math.floor(Math.min(minXBy.x, 0) / ROUTING_SCALING_FACTOR) *
      ROUTING_SCALING_FACTOR;

    const maxXElement = maxBy(
      concat(allNodesCoords, allPortsCoords, allPointsCoords),
      item => item.x + item.width
    );
    if (maxXElement == null) {
      throw new Error();
    }

    const maxX = Math.max(
      maxXElement.x + maxXElement.width,
      canvas.offsetWidth
    );

    const minYBy = minBy(
      concat(allNodesCoords, allPortsCoords, allPointsCoords),
      item => item.y
    );
    if (minYBy == null) {
      throw new Error();
    }

    const minY =
      Math.floor(Math.min(minYBy.y, 0) / ROUTING_SCALING_FACTOR) *
      ROUTING_SCALING_FACTOR;

    const maxYElement = maxBy(
      concat(allNodesCoords, allPortsCoords, allPointsCoords),
      item => item.y + item.height
    );
    if (maxYElement == null) {
      throw new Error();
    }

    const maxY = Math.max(
      maxYElement.y + maxYElement.height,
      canvas.offsetHeight
    );

    return {
      width: Math.ceil(Math.abs(minX) + maxX),
      hAdjustmentFactor: Math.abs(minX) / ROUTING_SCALING_FACTOR + 1,
      height: Math.ceil(Math.abs(minY) + maxY),
      vAdjustmentFactor: Math.abs(minY) / ROUTING_SCALING_FACTOR + 1
    };
  };

  /**
   * Updates (by reference) where nodes will be drawn on the matrix passed in.
   */
  public markNodes = (matrix: number[][]): void => {
    values(this.diagramModel.nodes).forEach(node => {
      const startX = Math.floor(node.x / ROUTING_SCALING_FACTOR);
      const endX = Math.ceil((node.x + node.width) / ROUTING_SCALING_FACTOR);
      const startY = Math.floor(node.y / ROUTING_SCALING_FACTOR);
      const endY = Math.ceil((node.y + node.height) / ROUTING_SCALING_FACTOR);

      for (let x = startX - 1; x <= endX + 1; x++) {
        for (let y = startY - 1; y < endY + 1; y++) {
          this.markMatrixPoint(
            matrix,
            this.translateRoutingX(x),
            this.translateRoutingY(y)
          );
        }
      }
    });
  };

  /**
   * Updates (by reference) where ports will be drawn on the matrix passed in.
   */
  public markPorts = (matrix: number[][]): void => {
    const allElements = flatMap(
      values(this.diagramModel.links).map(link =>
        ([] as PortModel[]).concat(link.sourcePort || [], link.targetPort || [])
      )
    );
    allElements
      .filter(port => port !== null)
      .forEach(port => {
        const startX = Math.floor(port.x / ROUTING_SCALING_FACTOR);
        const endX = Math.ceil((port.x + port.width) / ROUTING_SCALING_FACTOR);
        const startY = Math.floor(port.y / ROUTING_SCALING_FACTOR);
        const endY = Math.ceil((port.y + port.height) / ROUTING_SCALING_FACTOR);

        for (let x = startX - 1; x <= endX + 1; x++) {
          for (let y = startY - 1; y < endY + 1; y++) {
            this.markMatrixPoint(
              matrix,
              this.translateRoutingX(x),
              this.translateRoutingY(y)
            );
          }
        }
      });
  };

  public markMatrixPoint = (matrix: number[][], x: number, y: number) => {
    if (matrix[y] !== undefined && matrix[y][x] !== undefined) {
      matrix[y][x] = 1;
    }
  };

  public zoomToFit() {
    if (this.canvas == null) {
      throw new Error();
    }

    const xFactor = this.canvas.clientWidth / this.canvas.scrollWidth;
    const yFactor = this.canvas.clientHeight / this.canvas.scrollHeight;
    const zoomFactor = xFactor < yFactor ? xFactor : yFactor;

    this.diagramModel.setZoomLevel(
      this.diagramModel.getZoomLevel() * zoomFactor
    );
    this.diagramModel.setOffset(0, 0);
    this.repaintCanvas();
  }
}
