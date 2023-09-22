export class Piece {
    constructor(type, color, movement, hasmoved) {
      this.type = type;
      this.color = color;
      this.movement = movement;
      this.hasmoved = hasmoved;
    }
  
    isSliding() {
      return this.type == "b" || this.type == "q" || this.type == "r";
    }
  }


export function makePiece(id, color) {
if (id == "p") {
    let dir = color == "b" ? 1 : -1;
    return new Piece("p", color, [[dir, 0], [dir, 1], [dir, -1]], false);
}
else if (id == "n") {
    return new Piece("n", color, [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]], false);
}
else if (id == "b") {
    return new Piece("b", color, [[1, 1], [1, -1], [-1, 1], [-1, -1]], false);
}
else if (id == "r") {
    return new Piece("r", color, [[1, 0], [-1, 0], [0, 1], [0, -1]], false);
}
else if (id == "q") {
    return new Piece("q", color, [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]], false);
}
else if (id == "k") {
    return new Piece("k", color, [[1, 1], [1, 0], [1, -1], [0, 1], [0, -1], [-1, 1], [-1, 0], [-1, -1]], false);
}
}