import { PortModel } from "../models/PortModel";
import { AbstractFactory } from "./AbstractFactory";

export abstract class AbstractPortFactory<
  T extends PortModel = PortModel
> extends AbstractFactory<T> {}
