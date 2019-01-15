import React from "react";

export interface IDemoWorkspaceWidgetProps {
  buttons?: any;
}

export const DemoWorkspaceWidget: React.SFC<IDemoWorkspaceWidgetProps> = ({
  buttons,
  children
}) => (
  <div className="srd-demo-workspace">
    <div className="srd-demo-workspace__toolbar">{buttons}</div>
    <div className="srd-demo-workspace__content">{children}</div>
  </div>
);
