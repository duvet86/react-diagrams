import React from "react";
import { DefaultLabelModel } from "../models/DefaultLabelModel";
import { BaseWidget, IBaseWidgetProps } from "../../widgets/BaseWidget";

export interface IDefaultLabelWidgetProps extends IBaseWidgetProps {
  model: DefaultLabelModel;
}

export class DefaultLabelWidget extends BaseWidget<IDefaultLabelWidgetProps> {
  constructor(props: IDefaultLabelWidgetProps) {
    super("srd-default-label", props);
  }

  public render() {
    return <div {...this.getProps()}>{this.props.model.label}</div>;
  }
}
