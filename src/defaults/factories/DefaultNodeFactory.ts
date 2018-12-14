import { DefaultNodeModel } from "../models/DefaultNodeModel";
import React from "react";
import { DefaultNodeWidget } from "../widgets/DefaultNodeWidget";
import { DiagramEngine } from "../../DiagramEngine";
import { AbstractNodeFactory } from "../../factories/AbstractNodeFactory";
/**
 * @author Dylan Vorster
 */
export class DefaultNodeFactory extends AbstractNodeFactory<DefaultNodeModel> {
  constructor() {
    super("default");
  }

  public generateReactWidget(
    diagramEngine: DiagramEngine,
    node: DefaultNodeModel
  ): JSX.Element {
    return React.createElement(DefaultNodeWidget, {
      node,
      diagramEngine
    });
  }

  public getNewInstance(initialConfig?: any): DefaultNodeModel {
    return new DefaultNodeModel();
  }
}
