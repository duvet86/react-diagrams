import React from "react";
import { NodeModel } from "../models/NodeModel";
import { BaseWidget, IBaseWidgetProps } from "./BaseWidget";

export interface IPortProps extends IBaseWidgetProps {
  name: string;
  node: NodeModel;
}

export interface IPortState {
  selected: boolean;
}

/**
 * @author Dylan Vorster
 */
export class PortWidget extends BaseWidget<IPortProps, IPortState> {
  constructor(props: IPortProps) {
    super("srd-port", props);
    this.state = {
      selected: false
    };
  }

  public getClassName() {
    return (
      "port " +
      super.getClassName() +
      (this.state.selected ? this.bem("--selected") : "")
    );
  }

  public render() {
    return (
      <div
        {...this.getProps()}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        data-name={this.props.name}
        data-nodeid={this.props.node.getID()}
      />
    );
  }

  private handleMouseEnter = () => {
    this.setState({ selected: true });
  };

  private handleMouseLeave = () => {
    this.setState({ selected: false });
  };
}
