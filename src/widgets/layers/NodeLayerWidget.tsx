import React from "react";
import { DiagramEngine } from "../../DiagramEngine";
import { map } from "lodash";
import { NodeWidget } from "../NodeWidget";
import { NodeModel } from "../../models/NodeModel";
import { BaseWidget, IBaseWidgetProps } from "../BaseWidget";

export interface INodeLayerProps extends IBaseWidgetProps {
  diagramEngine: DiagramEngine;
}

export class NodeLayerWidget extends BaseWidget<INodeLayerProps> {
  constructor(props: INodeLayerProps) {
    super("srd-node-layer", props);
    this.state = {};
  }

  public componentDidUpdate() {
    this.updateNodeDimensions();
    this.props.diagramEngine.nodesRendered = true;
  }

  public render() {
    const diagramModel = this.props.diagramEngine.getDiagramModel();
    return (
      <div
        {...this.getProps()}
        style={{
          transform:
            "translate(" +
            diagramModel.getOffsetX() +
            "px," +
            diagramModel.getOffsetY() +
            "px) scale(" +
            diagramModel.getZoomLevel() / 100.0 +
            ")"
        }}
      >
        {map(diagramModel.getNodes(), (node: NodeModel) => {
          return React.createElement(
            NodeWidget,
            {
              diagramEngine: this.props.diagramEngine,
              key: node.id,
              node
            },
            this.props.diagramEngine.generateWidgetForNode(node)
          );
        })}
      </div>
    );
  }

  private updateNodeDimensions = () => {
    if (!this.props.diagramEngine.nodesRendered) {
      const diagramModel = this.props.diagramEngine.getDiagramModel();
      map(diagramModel.getNodes(), node => {
        node.updateDimensions(this.props.diagramEngine.getNodeDimensions(node));
      });
    }
  };
}
