import { BaseModel, IBaseModelListener } from "./BaseModel";
import { NodeModel } from "./NodeModel";
import { LinkModel } from "./LinkModel";
import { isFinite, values, map, size } from "lodash";
import { DiagramEngine } from "../DiagramEngine";

export class PortModel extends BaseModel<NodeModel, IBaseModelListener> {
  public name: string;
  // Calculated post rendering so routing can be done correctly
  public x: number = 0;
  public y: number = 0;
  public width: number = 0;
  public height: number = 0;

  private links: { [id: string]: LinkModel };
  private maximumLinks: number | undefined;

  constructor(name: string, type?: string, id?: string, maximumLinks?: number) {
    super(type, id);
    this.name = name;
    this.links = {};
    this.maximumLinks = maximumLinks;
  }

  public deSerialize(ob: any, engine: DiagramEngine) {
    super.deSerialize(ob, engine);
    this.name = ob.name;
    this.maximumLinks = ob.maximumLinks;
  }

  public serialize() {
    const parent = this.getParent();
    return Object.assign(super.serialize(), {
      name: this.name,
      parentNode: (parent && parent.id) || undefined,
      links: map(this.links, link => {
        return link.id;
      }),
      maximumLinks: this.maximumLinks
    });
  }

  public doClone(lookupTable = {}, clone: any) {
    const parent = this.getParent();
    clone.links = {};
    clone.parentNode = (parent && parent.clone(lookupTable)) || undefined;
  }

  public getNode(): NodeModel | undefined {
    return this.getParent();
  }

  public getName(): string {
    return this.name;
  }

  public getMaximumLinks(): number | undefined {
    return this.maximumLinks;
  }

  public setMaximumLinks(maximumLinks: number) {
    this.maximumLinks = maximumLinks;
  }

  public removeLink(link: LinkModel) {
    delete this.links[link.getID()];
  }

  public addLink(link: LinkModel) {
    this.links[link.getID()] = link;
  }

  public getLinks(): { [id: string]: LinkModel } {
    return this.links;
  }

  public createLinkModel(): LinkModel | null {
    if (isFinite(this.maximumLinks)) {
      const numberOfLinks: number = size(this.links);
      if (this.maximumLinks === 1 && numberOfLinks >= 1) {
        return values(this.links)[0];
      } else if (this.maximumLinks && numberOfLinks >= this.maximumLinks) {
        return null;
      }
    }
    return null;
  }

  public updateCoords({
    x,
    y,
    width,
    height
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  public canLinkToPort(port: PortModel): boolean {
    return true;
  }

  public isLocked() {
    const parent = this.getParent();

    return super.isLocked() || (parent != null && parent.isLocked());
  }
}
