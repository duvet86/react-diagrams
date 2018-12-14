import React from "react";
import { map } from "lodash";
import { DefaultNodeModel } from "../models/DefaultNodeModel";
import { DefaultPortLabel } from "./DefaultPortLabelWidget";
import { DefaultPortModel } from "../models/DefaultPortModel";
import { DiagramEngine } from "../../DiagramEngine";
import { BaseWidget, IBaseWidgetProps } from "../../widgets/BaseWidget";

export interface IDefaultNodeProps extends IBaseWidgetProps {
  node: DefaultNodeModel;
  diagramEngine: DiagramEngine;
}

/**
 * @author Dylan Vorster
 */
export class DefaultNodeWidget extends BaseWidget<IDefaultNodeProps> {
  constructor(props: IDefaultNodeProps) {
    super("srd-default-node", props);
    this.state = {};
  }

  public render() {
    return (
      <div {...this.getProps()} style={{ background: this.props.node.color }}>
        <div className={this.bem("__title")}>
          <div className={this.bem("__name")}>{this.props.node.name}</div>
        </div>
        <div className={this.bem("__ports")}>
          <div className={this.bem("__in")}>
            {map(this.props.node.getInPorts(), this.generatePort.bind(this))}
          </div>
          <div className={this.bem("__out")}>
            {map(this.props.node.getOutPorts(), this.generatePort.bind(this))}
          </div>
        </div>
      </div>
    );
  }

  private generatePort(port: DefaultPortModel) {
    return <DefaultPortLabel model={port} key={port.id} />;
  }
}
