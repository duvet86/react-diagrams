import React from "react";
import { DefaultNodeModel } from "../models/DefaultNodeModel";
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

  public getNewInstance(): DefaultNodeModel {
    return new DefaultNodeModel();
  }
}
