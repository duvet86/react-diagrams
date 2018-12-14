import { BaseEntity, IBaseListener } from "../BaseEntity";
import { IBaseEvent } from "../BaseEntity";
import { DiagramEngine } from "../DiagramEngine";

export interface IBaseModelListener extends IBaseListener {
  selectionChanged?(event: IBaseEvent & { isSelected: boolean }): void;
  entityRemoved?(event: IBaseEvent): void;
}

/**
 * @author Dylan Vorster
 */
export class BaseModel<
  X extends BaseEntity = BaseEntity,
  T extends IBaseModelListener = IBaseModelListener
> extends BaseEntity<T> {
  public parent: X | undefined;
  public type: string | undefined;

  private selected: boolean;

  constructor(type?: string, id?: string) {
    super(id);
    this.type = type;
    this.selected = false;
  }

  public getParent(): X | undefined {
    return this.parent;
  }

  public setParent(parent: X) {
    this.parent = parent;
  }

  public removeParent() {
    this.parent = undefined;
  }

  public getSelectedEntities(): Array<BaseModel<any, T>> {
    if (this.isSelected()) {
      return [this];
    }
    return [];
  }

  public deSerialize(ob: any, engine: DiagramEngine) {
    super.deSerialize(ob, engine);
    this.type = ob.type;
    this.selected = ob.selected;
  }

  public serialize() {
    return Object.assign(super.serialize(), {
      type: this.type,
      selected: this.selected
    });
  }

  public getType(): string | undefined {
    return this.type;
  }

  public getID(): string {
    return this.id;
  }

  public isSelected(): boolean {
    return this.selected;
  }

  public setSelected(selected: boolean = true) {
    this.selected = selected;
    this.iterateListeners((listener, event) => {
      if (listener.selectionChanged) {
        listener.selectionChanged({ ...event, isSelected: selected });
      }
    });
  }

  public remove() {
    this.iterateListeners((listener, event) => {
      if (listener.entityRemoved) {
        listener.entityRemoved(event);
      }
    });
  }
}
