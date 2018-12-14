import React from "react";
import { DiagramEngine } from "../DiagramEngine";
import { NodeModel } from "../models/NodeModel";
import { BaseWidget, IBaseWidgetProps } from "./BaseWidget";

export interface INodeProps extends IBaseWidgetProps {
  node: NodeModel;
  children?: any;
  diagramEngine: DiagramEngine;
}

/**
 * @author Dylan Vorster
 */
export class NodeWidget extends BaseWidget<INodeProps> {
  constructor(props: INodeProps) {
    super("srd-node", props);
    this.state = {};
  }

  public shouldComponentUpdate() {
    return this.props.diagramEngine.canEntityRepaint(this.props.node);
  }

  public getClassName() {
    return (
      "node " +
      super.getClassName() +
      (this.props.node.isSelected() ? this.bem("--selected") : "")
    );
  }

  public render() {
    return (
      <div
        {...this.getProps()}
        data-nodeid={this.props.node.id}
        style={{
          top: this.props.node.y,
          left: this.props.node.x
        }}
      >
        {this.props.children}
      </div>
    );
  }
}
