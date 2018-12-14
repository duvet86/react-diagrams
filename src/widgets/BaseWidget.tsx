import React from "react";

export interface IBaseWidgetProps {
  /**
   * Override the base class name
   */
  baseClass?: string;
  /**
   * append additional classes
   */
  className?: string;
  /**
   * Additional props to add
   */
  extraProps?: any;
}

export class BaseWidget<
  P extends IBaseWidgetProps = IBaseWidgetProps,
  S = any
> extends React.Component<P, S> {
  private className: string;

  constructor(name: string, props: P) {
    super(props);
    this.className = name;
  }

  public bem(selector: string): string {
    return (this.props.baseClass || this.className) + selector + " ";
  }

  public getClassName(): string {
    return (
      (this.props.baseClass || this.className) +
      " " +
      (this.props.className ? this.props.className + " " : "")
    );
  }

  public getProps(): any {
    return {
      ...((this.props.extraProps as any) || {}),
      className: this.getClassName()
    };
  }
}
