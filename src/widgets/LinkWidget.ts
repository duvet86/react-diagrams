import { DiagramEngine } from "../DiagramEngine";
import { LinkModel } from "../models/LinkModel";
import { BaseWidget, IBaseWidgetProps } from "./BaseWidget";

export interface ILinkProps extends IBaseWidgetProps {
  link: LinkModel;
  diagramEngine: DiagramEngine;
  children?: any;
}

/**
 * @author Dylan Vorster
 */
export class LinkWidget extends BaseWidget<ILinkProps, {}> {
  constructor(props: ILinkProps) {
    super("srd-link", props);
    this.state = {};
  }

  public shouldComponentUpdate() {
    return this.props.diagramEngine.canEntityRepaint(this.props.link);
  }

  public render() {
    return this.props.children;
  }
}
