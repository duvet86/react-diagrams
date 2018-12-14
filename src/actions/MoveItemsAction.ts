import { BaseAction } from "./BaseAction";
import { ISelectionModel } from "../models/SelectionModel";
import { PointModel } from "../models/PointModel";
import { NodeModel } from "../models/NodeModel";
import { DiagramEngine } from "../DiagramEngine";
import { BaseModel } from "../models/BaseModel";

export class MoveItemsAction extends BaseAction {
  public selectionModels: ISelectionModel[];
  public moved: boolean;

  constructor(mouseX: number, mouseY: number, diagramEngine: DiagramEngine) {
    super(mouseX, mouseY);
    this.moved = false;
    diagramEngine.enableRepaintEntities(
      diagramEngine.getDiagramModel().getSelectedItems()
    );
    let selectedItems = diagramEngine.getDiagramModel().getSelectedItems();

    // Dont allow items which are locked to move.
    selectedItems = selectedItems.filter(item => {
      return !diagramEngine.isModelLocked(item);
    });

    this.selectionModels = selectedItems.map((item: BaseModel) => {
      return {
        model: item,
        initialX: (item as PointModel | NodeModel).x,
        initialY: (item as PointModel | NodeModel).y
      };
    });
  }
}
