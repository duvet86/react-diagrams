import { BaseModel } from "../models/BaseModel";

export abstract class AbstractFactory<T extends BaseModel> {
  private type: string;

  constructor(name: string) {
    this.type = name;
  }

  public getType(): string {
    return this.type;
  }

  public abstract getNewInstance(initialConfig?: any): T;
}
