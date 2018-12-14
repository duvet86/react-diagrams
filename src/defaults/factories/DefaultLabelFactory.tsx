import React from "react";
import { DiagramEngine } from "../../DiagramEngine";
import { AbstractLabelFactory } from "../../factories/AbstractLabelFactory";
import { DefaultLabelModel } from "../models/DefaultLabelModel";
import { DefaultLabelWidget } from "../widgets/DefaultLabelWidget";

/**
 * @author Dylan Vorster
 */
export class DefaultLabelFactory extends AbstractLabelFactory<
  DefaultLabelModel
> {
  constructor() {
    super("default");
  }

  public generateReactWidget(
    _: DiagramEngine,
    label: DefaultLabelModel
  ): JSX.Element {
    return <DefaultLabelWidget model={label} />;
  }

  public getNewInstance(initialConfig?: any): DefaultLabelModel {
    return new DefaultLabelModel();
  }
}
