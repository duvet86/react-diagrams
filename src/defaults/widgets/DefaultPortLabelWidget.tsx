import React from "react";
import { DefaultPortModel } from "../models/DefaultPortModel";
import { PortWidget } from "../../widgets/PortWidget";
import { BaseWidget, IBaseWidgetProps } from "../../widgets/BaseWidget";

export interface IDefaultPortLabelProps extends IBaseWidgetProps {
  model: DefaultPortModel;
}

/**
 * @author Dylan Vorster
 */
export class DefaultPortLabel extends BaseWidget<IDefaultPortLabelProps> {
  constructor(props: IDefaultPortLabelProps) {
    super("srd-default-port", props);
  }

  public getClassName() {
    return (
      super.getClassName() +
      (this.props.model.in ? this.bem("--in") : this.bem("--out"))
    );
  }

  public render() {
    const parent = this.props.model.getParent();
    if (parent == null) {
      return null;
    }

    const port = <PortWidget node={parent} name={this.props.model.name} />;
    const label = <div className="name">{this.props.model.label}</div>;

    return (
      <div {...this.getProps()}>
        {this.props.model.in ? port : label}
        {this.props.model.in ? label : port}
      </div>
    );
  }
}
