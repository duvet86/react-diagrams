import PathFinding from "../../src/routing/PathFinding";
import { DiagramEngine } from "../../src/main";

describe("calculating start and end points", () => {
  let pathFinding: PathFinding;

  beforeEach(() => {
    pathFinding = new PathFinding(new DiagramEngine());
  });

  test("return correct object for valid walkable input", () => {
    const matrix = [
      [0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0]
    ];
    const path = [[0, 5], [1, 4], [2, 3], [3, 2], [4, 1], [5, 0]];

    const result = pathFinding.calculateLinkStartEndCoords(matrix, path);
    if (result == null) {
      throw new Error();
    }

    expect(result.start).toEqual({
      x: 2,
      y: 3
    });
    expect(result.end).toEqual({
      x: 3,
      y: 2
    });
    expect(result.pathToStart).toEqual([[0, 5], [1, 4]]);
    expect(result.pathToEnd).toEqual([[3, 2], [4, 1], [5, 0]]);
  });

  test("undefined is returned when no walkable path exists", () => {
    const matrix = [[0, 0, 1, 1], [0, 0, 1, 1], [1, 1, 0, 0], [1, 1, 0, 0]];
    const path = [[0, 3], [1, 2], [2, 1], [3, 0]];

    const result = pathFinding.calculateLinkStartEndCoords(matrix, path);

    expect(result).toBeUndefined();
  });
});
