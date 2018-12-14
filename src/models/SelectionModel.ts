import { BaseModel, IBaseModelListener } from "./BaseModel";
import { BaseEntity } from "../BaseEntity";

export interface ISelectionModel {
  model: BaseModel<BaseEntity, IBaseModelListener>;
  initialX: number;
  initialY: number;
}
