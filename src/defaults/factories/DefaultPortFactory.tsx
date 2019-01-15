import { DefaultPortModel } from "../models/DefaultPortModel";
import { AbstractPortFactory } from "../../factories/AbstractPortFactory";

export class DefaultPortFactory extends AbstractPortFactory<DefaultPortModel> {
  constructor() {
    super("default");
  }

  public getNewInstance(): DefaultPortModel {
    return new DefaultPortModel(true, "unknown");
  }
}
