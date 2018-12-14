export class BaseAction {
  public mouseX: number;
  public mouseY: number;
  public ms: number;

  constructor(mouseX: number, mouseY: number) {
    this.mouseX = mouseX;
    this.mouseY = mouseY;
    this.ms = new Date().getTime();
  }
}
