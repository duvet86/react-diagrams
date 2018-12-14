import React from "react";
import { DiagramEngine } from "../DiagramEngine";
import { forEach, some, values } from "lodash";
import { LinkLayerWidget } from "./layers/LinkLayerWidget";
import { NodeLayerWidget } from "./layers/NodeLayerWidget";
import { Toolkit } from "../Toolkit";
import { BaseAction } from "../actions/BaseAction";
import { MoveCanvasAction } from "../actions/MoveCanvasAction";
import { MoveItemsAction } from "../actions/MoveItemsAction";
import { SelectingAction } from "../actions/SelectingAction";
import { NodeModel } from "../models/NodeModel";
import { PointModel } from "../models/PointModel";
import { PortModel } from "../models/PortModel";
import { LinkModel } from "../models/LinkModel";
import { BaseModel, IBaseModelListener } from "../models/BaseModel";
import { BaseEntity } from "../BaseEntity";
import { BaseWidget, IBaseWidgetProps } from "./BaseWidget";

export interface IDiagramProps extends IBaseWidgetProps {
  diagramEngine: DiagramEngine;

  allowLooseLinks?: boolean;
  allowCanvasTranslation?: boolean;
  allowCanvasZoom?: boolean;
  inverseZoom?: boolean;
  maxNumberPointsPerLink?: number;
  smartRouting?: boolean;

  actionStartedFiring?: (action: BaseAction) => boolean;
  actionStillFiring?: (action: BaseAction) => void;
  actionStoppedFiring?: (action: BaseAction) => void;

  deleteKeys?: number[];
}

export interface IDiagramState {
  action: BaseAction | null;
  wasMoved: boolean;
  renderedNodes: boolean;
  windowListener: any;
  diagramEngineListener: any;
  document: any;
}

/**
 * @author Dylan Vorster
 */
export class DiagramWidget extends BaseWidget<IDiagramProps, IDiagramState> {
  //   public static defaultProps: IDiagramProps = {
  //     diagramEngine: null,
  //     allowLooseLinks: true,
  //     allowCanvasTranslation: true,
  //     allowCanvasZoom: true,
  //     inverseZoom: false,
  //     maxNumberPointsPerLink: Infinity, // backwards compatible default
  //     smartRouting: false,
  //     deleteKeys: [46, 8]
  //   };

  constructor(props: IDiagramProps) {
    super("srd-diagram", props);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.state = {
      action: null,
      wasMoved: false,
      renderedNodes: false,
      windowListener: null,
      diagramEngineListener: null,
      document: null
    };
  }

  public componentWillUnmount() {
    this.props.diagramEngine.removeListener(this.state.diagramEngineListener);
    this.props.diagramEngine.setCanvas(null);
    this.state.document.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("keyup", this.onKeyUpPointer);
    window.removeEventListener("mousemove", this.onMouseMove);
  }

  public componentWillReceiveProps(nextProps: IDiagramProps) {
    if (this.props.diagramEngine !== nextProps.diagramEngine) {
      this.props.diagramEngine.removeListener(this.state.diagramEngineListener);
      const diagramEngineListener = nextProps.diagramEngine.addListener({
        repaintCanvas: () => this.forceUpdate()
      });
      this.setState({ diagramEngineListener });
    }
  }

  public componentWillUpdate(nextProps: IDiagramProps) {
    if (
      this.props.diagramEngine.diagramModel.id !==
      nextProps.diagramEngine.diagramModel.id
    ) {
      this.setState({ renderedNodes: false });
      nextProps.diagramEngine.diagramModel.rendered = true;
    }
    if (!nextProps.diagramEngine.diagramModel.rendered) {
      this.setState({ renderedNodes: false });
      nextProps.diagramEngine.diagramModel.rendered = true;
    }
  }

  public componentDidUpdate() {
    if (!this.state.renderedNodes) {
      this.setState({
        renderedNodes: true
      });
    }
  }

  public componentDidMount() {
    // Add a keyboard listener.
    this.setState({
      document,
      renderedNodes: true,
      diagramEngineListener: this.props.diagramEngine.addListener({
        repaintCanvas: () => {
          this.forceUpdate();
        }
      })
    });

    window.addEventListener("keyup", this.onKeyUpPointer, false);

    // dont focus the window when in test mode - jsdom fails
    if (process.env.NODE_ENV !== "test") {
      window.focus();
    }
  }

  /**
   * Gets a model and element under the mouse cursor
   */
  public getMouseElement(
    event: React.MouseEvent
  ): {
    model: BaseModel<BaseEntity, IBaseModelListener>;
    element: Element;
  } | null {
    const target = event.target as Element;
    const diagramModel = this.props.diagramEngine.diagramModel;

    // Is it a port?
    let element = Toolkit.closest(target, ".port[data-name]");
    if (element) {
      const nodeElement = Toolkit.closest(
        target,
        ".node[data-nodeid]"
      ) as HTMLElement;

      const nodeId = nodeElement.getAttribute("data-nodeid");
      const name = element.getAttribute("data-name");
      if (nodeId == null || name == null) {
        throw new Error();
      }
      const node = diagramModel.getNode(nodeId);
      if (node == null) {
        throw new Error();
      }

      return {
        model: node.getPort(name),
        element
      };
    }

    // Look for a point.
    element = Toolkit.closest(target, ".point[data-id]");
    if (element) {
      const linkid = element.getAttribute("data-linkid");
      const id = element.getAttribute("data-id");
      if (linkid == null || id == null) {
        throw new Error();
      }
      const link = diagramModel.getLink(linkid);
      if (link == null) {
        throw new Error();
      }
      const model = link.getPointModel(id);
      if (model == null) {
        throw new Error();
      }

      return {
        model,
        element
      };
    }

    // Look for a link.
    element = Toolkit.closest(target, "[data-linkid]");
    if (element) {
      const linkid = element.getAttribute("data-linkid");
      if (linkid == null) {
        throw new Error();
      }
      const model = diagramModel.getLink(linkid);
      if (model == null) {
        throw new Error();
      }

      return {
        model,
        element
      };
    }

    // Look for a node.
    element = Toolkit.closest(target, ".node[data-nodeid]");
    if (element) {
      const nodeId = element.getAttribute("data-nodeid");
      if (nodeId == null) {
        throw new Error();
      }
      const model = diagramModel.getNode(nodeId);
      if (model == null) {
        throw new Error();
      }

      return {
        model,
        element
      };
    }

    return null;
  }

  public fireAction() {
    if (this.state.action && this.props.actionStillFiring) {
      this.props.actionStillFiring(this.state.action);
    }
  }

  public stopFiringAction(shouldSkipEvent?: boolean) {
    if (
      this.state.action &&
      this.props.actionStoppedFiring &&
      !shouldSkipEvent
    ) {
      this.props.actionStoppedFiring(this.state.action);
    }
    this.setState({ action: null });
  }

  public startFiringAction(action: BaseAction) {
    let setState = true;
    if (this.props.actionStartedFiring) {
      setState = this.props.actionStartedFiring(action);
    }
    if (setState) {
      this.setState({ action });
    }
  }

  public onMouseMove(event: MouseEvent) {
    const diagramEngine = this.props.diagramEngine;
    const diagramModel = diagramEngine.getDiagramModel();
    // Select items so draw a bounding box.
    if (this.state.action instanceof SelectingAction) {
      const relative = diagramEngine.getRelativePoint(
        event.clientX,
        event.clientY
      );

      forEach(diagramModel.getNodes(), node => {
        if (
          (this.state.action as SelectingAction).containsElement(
            node.x,
            node.y,
            diagramModel
          )
        ) {
          node.setSelected(true);
        }
      });

      forEach(diagramModel.getLinks(), link => {
        let allSelected = true;
        forEach(link.points, point => {
          if (
            (this.state.action as SelectingAction).containsElement(
              point.x,
              point.y,
              diagramModel
            )
          ) {
            point.setSelected(true);
          } else {
            allSelected = false;
          }
        });

        if (allSelected) {
          link.setSelected(true);
        }
      });

      this.state.action.mouseX2 = relative.x;
      this.state.action.mouseY2 = relative.y;

      this.fireAction();
      this.setState({ action: this.state.action });
      return;
    } else if (this.state.action instanceof MoveItemsAction) {
      const amountX = event.clientX - this.state.action.mouseX;
      const amountY = event.clientY - this.state.action.mouseY;
      const amountZoom = diagramModel.getZoomLevel() / 100;

      forEach(this.state.action.selectionModels, model => {
        // in this case we need to also work out the relative grid position
        if (
          model.model instanceof NodeModel ||
          (model.model instanceof PointModel &&
            !model.model.isConnectedToPort())
        ) {
          model.model.x = diagramModel.getGridPosition(
            model.initialX + amountX / amountZoom
          );
          model.model.y = diagramModel.getGridPosition(
            model.initialY + amountY / amountZoom
          );

          // update port coordinates as well
          if (model.model instanceof NodeModel) {
            forEach(model.model.getPorts(), port => {
              const portCoords = this.props.diagramEngine.getPortCoords(port);
              port.updateCoords(portCoords);
            });
          }

          if (diagramEngine.isSmartRoutingEnabled()) {
            diagramEngine.calculateRoutingMatrix();
          }
        } else if (model.model instanceof PointModel) {
          // we want points that are connected to ports, to not necessarily snap to grid
          // this stuff needs to be pixel perfect, dont touch it
          model.model.x =
            model.initialX + diagramModel.getGridPosition(amountX / amountZoom);
          model.model.y =
            model.initialY + diagramModel.getGridPosition(amountY / amountZoom);
        }
      });

      if (diagramEngine.isSmartRoutingEnabled()) {
        diagramEngine.calculateCanvasMatrix();
      }

      this.fireAction();
      if (!this.state.wasMoved) {
        this.setState({ wasMoved: true });
      } else {
        this.forceUpdate();
      }
    } else if (this.state.action instanceof MoveCanvasAction) {
      // Translate the actual canvas.
      if (this.props.allowCanvasTranslation) {
        diagramModel.setOffset(
          this.state.action.initialOffsetX +
            (event.clientX - this.state.action.mouseX),
          this.state.action.initialOffsetY +
            (event.clientY - this.state.action.mouseY)
        );
        this.fireAction();
        this.forceUpdate();
      }
    }
  }

  public onMouseUp(event: React.MouseEvent) {
    const diagramEngine = this.props.diagramEngine;
    // Are we going to connect a link to something?
    if (this.state.action instanceof MoveItemsAction) {
      const element = this.getMouseElement(event);
      forEach(this.state.action.selectionModels, model => {
        // Only care about points connecting to things.
        if (!(model.model instanceof PointModel)) {
          return;
        }
        if (
          element &&
          element.model instanceof PortModel &&
          !diagramEngine.isModelLocked(element.model)
        ) {
          const link = model.model.getLink();
          if (link == null) {
            throw new Error();
          }

          if (link.getTargetPort() !== null) {
            // If this was a valid link already
            // and we are adding a node in the middle, create 2 links from the original.
            if (
              link.getTargetPort() !== element.model &&
              link.getSourcePort() !== element.model
            ) {
              const targetPort = link.getTargetPort();
              if (targetPort == null) {
                throw new Error();
              }

              const newLink = link.clone({});
              newLink.setSourcePort(element.model);
              newLink.setTargetPort(targetPort);
              link.setTargetPort(element.model);
              targetPort.removeLink(link);
              newLink.removePointsBefore(
                newLink.getPoints()[link.getPointIndex(model.model)]
              );
              link.removePointsAfter(model.model);
              diagramEngine.getDiagramModel().addLink(newLink);
              // If we are connecting to the same target or source, remove tweener points.
            } else if (link.getTargetPort() === element.model) {
              link.removePointsAfter(model.model);
            } else if (link.getSourcePort() === element.model) {
              link.removePointsBefore(model.model);
            }
          } else {
            link.setTargetPort(element.model);
          }
          delete this.props.diagramEngine.linksThatHaveInitiallyRendered[
            link.getID()
          ];
        }
      });

      // Check for / remove any loose links in any models which have been moved.
      if (!this.props.allowLooseLinks && this.state.wasMoved) {
        forEach(this.state.action.selectionModels, model => {
          // Only care about points connecting to things.
          if (!(model.model instanceof PointModel)) {
            return;
          }

          const selectedPoint: PointModel = model.model;
          const link = selectedPoint.getLink();
          if (
            link &&
            (link.getSourcePort() === null || link.getTargetPort() === null)
          ) {
            link.remove();
          }
        });
      }

      // Remove any invalid links.
      forEach(this.state.action.selectionModels, model => {
        // Only care about points connecting to things.
        if (!(model.model instanceof PointModel)) {
          return;
        }

        const link = model.model.getLink();
        if (link == null) {
          throw new Error();
        }

        const sourcePort = link.getSourcePort();
        const targetPort = link.getTargetPort();
        if (sourcePort !== null && targetPort !== null) {
          if (!sourcePort.canLinkToPort(targetPort)) {
            // Link not allowed.
            link.remove();
          } else if (
            some(
              values(targetPort.getLinks()),
              (l: LinkModel) =>
                l !== link &&
                (l.getSourcePort() === sourcePort ||
                  l.getTargetPort() === sourcePort)
            )
          ) {
            // Link is a duplicate.
            link.remove();
          }
        }
      });

      diagramEngine.clearRepaintEntities();
      this.stopFiringAction(!this.state.wasMoved);
    } else {
      diagramEngine.clearRepaintEntities();
      this.stopFiringAction();
    }
    this.state.document.removeEventListener("mousemove", this.onMouseMove);
    this.state.document.removeEventListener("mouseup", this.onMouseUp);
  }

  public drawSelectionBox() {
    const dimensions = (this.state
      .action as SelectingAction).getBoxDimensions();
    return (
      <div
        className={this.bem("__selector")}
        style={{
          top: dimensions.top,
          left: dimensions.left,
          width: dimensions.width,
          height: dimensions.height
        }}
      />
    );
  }

  public render() {
    const diagramEngine = this.props.diagramEngine;
    diagramEngine.setMaxNumberPointsPerLink(
      this.props.maxNumberPointsPerLink || Infinity
    );
    diagramEngine.setSmartRoutingStatus(this.props.smartRouting || false);

    return (
      <div
        {...this.getProps()}
        ref={ref => {
          if (ref) {
            this.props.diagramEngine.setCanvas(ref);
          }
        }}
        onWheel={this.handleWheel}
        onMouseDown={this.handleMouseDown}
      >
        {this.state.renderedNodes && (
          <LinkLayerWidget
            diagramEngine={diagramEngine}
            pointAdded={this.handlePointAdded}
          />
        )}
        <NodeLayerWidget diagramEngine={diagramEngine} />
        {this.state.action instanceof SelectingAction &&
          this.drawSelectionBox()}
      </div>
    );
  }

  private onKeyUpPointer = (event: KeyboardEvent) => {
    const deleteKeys = this.props.deleteKeys || [46, 8];

    // Delete all selected.
    if (deleteKeys.indexOf(event.keyCode) !== -1) {
      forEach(
        this.props.diagramEngine.getDiagramModel().getSelectedItems(),
        element => {
          // Only delete items which are not locked.
          if (!this.props.diagramEngine.isModelLocked(element)) {
            element.remove();
          }
        }
      );
      this.forceUpdate();
    }
  };

  private handleWheel = (event: WheelEvent) => {
    const currentTarget = event.currentTarget as Element;
    if (currentTarget == null) {
      return;
    }
    const { diagramEngine } = this.props;
    const diagramModel = diagramEngine.getDiagramModel();

    if (this.props.allowCanvasZoom) {
      event.preventDefault();
      event.stopPropagation();
      const oldZoomFactor = diagramModel.getZoomLevel() / 100;
      let scrollDelta = this.props.inverseZoom ? -event.deltaY : event.deltaY;
      // Check if it is pinch gesture.
      if (event.ctrlKey && scrollDelta % 1 !== 0) {
        /*
          Chrome and Firefox sends wheel event with deltaY that
          have fractional part, also `ctrlKey` prop of the event is true
          though ctrl isn't pressed.
        */
        scrollDelta /= 3;
      } else {
        scrollDelta /= 60;
      }
      if (diagramModel.getZoomLevel() + scrollDelta > 10) {
        diagramModel.setZoomLevel(diagramModel.getZoomLevel() + scrollDelta);
      }

      const zoomFactor = diagramModel.getZoomLevel() / 100;

      const boundingRect = currentTarget.getBoundingClientRect();
      const clientWidth = boundingRect.width;
      const clientHeight = boundingRect.height;
      // compute difference between rect before and after scroll
      const widthDiff = clientWidth * zoomFactor - clientWidth * oldZoomFactor;
      const heightDiff =
        clientHeight * zoomFactor - clientHeight * oldZoomFactor;
      // compute mouse coords relative to canvas
      const clientX = event.clientX - boundingRect.left;
      const clientY = event.clientY - boundingRect.top;

      // compute width and height increment factor
      const xFactor =
        (clientX - diagramModel.getOffsetX()) / oldZoomFactor / clientWidth;
      const yFactor =
        (clientY - diagramModel.getOffsetY()) / oldZoomFactor / clientHeight;

      diagramModel.setOffset(
        diagramModel.getOffsetX() - widthDiff * xFactor,
        diagramModel.getOffsetY() - heightDiff * yFactor
      );

      diagramEngine.enableRepaintEntities([]);
      this.forceUpdate();
    }
  };

  private handleMouseDown = (event: React.MouseEvent) => {
    if (event.nativeEvent.which === 3) {
      return;
    }

    const { diagramEngine } = this.props;
    const diagramModel = diagramEngine.getDiagramModel();
    this.setState({ ...this.state, wasMoved: false });

    diagramEngine.clearRepaintEntities();
    const model = this.getMouseElement(event);
    // The canvas was selected.
    if (model === null) {
      // Is it a multiple selection?
      if (event.shiftKey) {
        const relative = diagramEngine.getRelativePoint(
          event.clientX,
          event.clientY
        );
        this.startFiringAction(new SelectingAction(relative.x, relative.y));
      } else {
        // Its a drag the canvas event.
        diagramModel.clearSelection();
        this.startFiringAction(
          new MoveCanvasAction(event.clientX, event.clientY, diagramModel)
        );
      }
    } else if (model.model instanceof PortModel) {
      // Its a port element, we want to drag a link.
      if (!this.props.diagramEngine.isModelLocked(model.model)) {
        const relative = diagramEngine.getRelativeMousePoint(event);
        const sourcePort = model.model;
        const link = sourcePort.createLinkModel();
        if (link == null) {
          throw new Error();
        }

        link.setSourcePort(sourcePort);

        if (link) {
          link.removeMiddlePoints();
          if (link.getSourcePort() !== sourcePort) {
            link.setSourcePort(sourcePort);
          }
          link.setTargetPort(null);

          link.getFirstPoint().updateLocation(relative);
          link.getLastPoint().updateLocation(relative);

          diagramModel.clearSelection();
          link.getLastPoint().setSelected(true);
          diagramModel.addLink(link);

          this.startFiringAction(
            new MoveItemsAction(event.clientX, event.clientY, diagramEngine)
          );
        }
      } else {
        diagramModel.clearSelection();
      }
    } else {
      // Its some or other element, probably want to move it.
      if (!event.shiftKey && !model.model.isSelected()) {
        diagramModel.clearSelection();
      }
      model.model.setSelected(true);

      this.startFiringAction(
        new MoveItemsAction(event.clientX, event.clientY, diagramEngine)
      );
    }
    this.state.document.addEventListener("mousemove", this.onMouseMove);
    this.state.document.addEventListener("mouseup", this.onMouseUp);
  };

  private handlePointAdded = (point: PointModel, event: React.MouseEvent) => {
    const { diagramEngine } = this.props;
    const diagramModel = diagramEngine.getDiagramModel();

    this.state.document.addEventListener("mousemove", this.onMouseMove);
    this.state.document.addEventListener("mouseup", this.onMouseUp);
    event.stopPropagation();
    diagramModel.clearSelection(point);
    this.setState({
      action: new MoveItemsAction(event.clientX, event.clientY, diagramEngine)
    });
  };
}
