import { useState } from 'react';
import Draggable from 'react-draggable';

function Square({ parity, piece, highlighted }) {
  let base = (parity ? "light" : "dark");
  let color = highlighted ? base + "-highlight" : base;
  return (
    <div className={"square " + color}>
      <Draggable position={{x: 0, y: 0}}>
          {getImgFromPiece(piece)}
      </Draggable>
    </div>
  );
}

function GameBoard({ board }) {
  let b = [];
  let row;
  let p = new Piece();
  for (let i = 0; i < 8; i++) {
    row = [];
    for (let j = 0; j < 8; j++) { 
      row.push(<Square parity={(i + j) % 2 == 0} piece={board.grid[i][j]} highlighted={board.highlighter.some(position => (position.y == i && position.x == j))} key={j}/>);
    }
    b.push(<div className="board-row" key={i}>{row}</div>);
  }
  return (<>{b}</>);
}

export default function Game() {
  const [board, setBoard] = useState(getBoardFromFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", false));
  const [localMousePos, setLocalMousePos] = useState({});
  const [clicked, setClicked] = useState({});

  const handleMouseMove = (event) => {
    const localX = event.clientX - event.currentTarget.offsetLeft;
    const localY = event.clientY - event.currentTarget.offsetTop;

    setLocalMousePos({ x: localX, y: localY });
  };

  function onClick() {
    let click = {y: Math.floor(localMousePos.y/100), x: Math.floor(localMousePos.x/100)};
    click.y = click.y < 0 ? 0 : click.y;
    click.x = click.x < 0 ? 0 : click.x;
    click.y = click.y > 7 ? 7 : click.y;
    click.x = click.x > 7 ? 7 : click.x;
    setClicked(click);
    setBoard((prevboard) => prevboard.highlight(prevboard.getLegalMoveSet(click)));
    }

  function onRelease() {
    let click = {y: Math.floor(localMousePos.y/100), x: Math.floor(localMousePos.x/100)};
    click.y = click.y < 0 ? 0 : click.y;
    click.y = click.y > 7 ? 7 : click.y;
    click.x = click.x < 0 ? 0 : click.x;
    click.x = click.x > 7 ? 7 : click.x;
    if (board.highlighter.some(position => (position.y == click.y && position.x == click.x))) {
      setBoard((prevboard) => prevboard.makeMove(clicked, click));
    }
    setBoard((prevboard) => prevboard.resetHighlight());
  }

  return (
    <div className="game">
      <div onMouseDown={onClick} onMouseUp={onRelease} className="game-board" onMouseMove={handleMouseMove}>
        <GameBoard board={board}/>
      </div>
    </div>
  );
}

class Board {
  constructor(grid, whitePieces, blackPieces, isBlackTurn, highlighter) {
    this.grid = grid;
    this.highlighter = highlighter;
    this.whitePieces = whitePieces;
    this.blackPieces = blackPieces;
    this.isBlackTurn = isBlackTurn;
  }

  highlight(validMoves) {
    let newboard = this.clone()
    for (let i = 0; i < validMoves.length; i++) {
      newboard.highlighter.push(validMoves[i]);
    }
    return newboard;
  }

  resetHighlight() {
    let newboard = this.clone();
    newboard.highlighter = [];
    return newboard;
  }

  makeMove(oldPos, newPos) {
    let newboard = this.clone()
    if (newboard.isBlackTurn) {
      newboard.blackPieces = newboard.blackPieces.filter((piece)=>{return !(piece.y == oldPos.y && piece.x == oldPos.x)})
      newboard.blackPieces.push(newPos);
      newboard.whitePieces = newboard.whitePieces.filter((piece)=>{return !(piece.y == newPos.y && piece.x == newPos.x)});
    }
    else {
      newboard.whitePieces = newboard.whitePieces.filter((piece)=>{return !(piece.y == oldPos.y && piece.x == oldPos.x)})
      newboard.whitePieces.push(newPos);
      newboard.blackPieces = newboard.blackPieces.filter((piece)=>{return !(piece.y == newPos.y && piece.x == newPos.x)});
    }
    newboard.isBlackTurn = !newboard.isBlackTurn;
    newboard.grid[newPos.y][newPos.x] = newboard.grid[oldPos.y][oldPos.x];
    newboard.grid[oldPos.y][oldPos.x] = null;
    return newboard;
  }
  
  getLegalMoveSet(click) {
    let ourpieces = this.isBlackTurn ? this.blackPieces : this.whitePieces;
    if (!ourpieces.some(position => (position.y == click.y && position.x == click.x))) {
      return []
    }
    let piece = this.grid[click.y][click.x];
    if (piece.isSliding()) {
      return this.getSlidingMoveSet(click);
    }
    else {
      if (piece.type == "n") {
        return this.getKnightMoveSet(click);
      }
      else if (piece.type == "p") {
        return this.getPawnMoveSet(click);
      }
      else {
        return []
      }
    }
  }

  getSlidingMoveSet(click) {
    let legalmoves = [];
    let piece = this.grid[click.y][click.x];
      for (let i = 0; i < piece.movement.length; i++) {
        let dy = piece.movement[i][0];
        let dx = piece.movement[i][1];
        let curry = click.y + dy;
        let currx = click.x + dx;
        while (curry >= 0 && curry < 8 && currx >= 0 && currx < 8 && this.grid[curry][currx] == null) {
          legalmoves.push({x: currx, y: curry});
          curry += dy;
          currx += dx;
        }
        if (curry >= 0 && curry < 8 && currx >= 0 && currx < 8 && this.grid[curry][currx].color != piece.color) {
          legalmoves.push({x: currx, y: curry});
        }
      }
      return legalmoves;
  }

  getKnightMoveSet(click) {
    let legalmoves = [];
    let piece = this.grid[click.y][click.x];
    for (let i = 0; i < piece.movement.length; i++) {
      let tary = click.y + piece.movement[i][0];
      let tarx = click.x + piece.movement[i][1];
      if (tary >= 0 && tary < 8 && tarx >= 0 && tarx < 8 && (this.grid[tary][tarx] == null || this.grid[tary][tarx].color != piece.color)) {
        legalmoves.push({x: tarx, y: tary});
      }
    }
    return legalmoves;
  }
  getPawnMoveSet(click) {
    let legalmoves = [];
    let piece = this.grid[click.y][click.x];
    for (let i = 1; i < piece.movement.length; i++){
      let tary = click.y + piece.movement[i][0];
      let tarx = click.x + piece.movement[i][1];
      if (tary >= 0 && tary < 8 && tarx >= 0 && tarx < 8 && this.grid[tary][tarx] != null && this.grid[tary][tarx].color != piece.color) {
        legalmoves.push({x: tarx, y: tary});
      }
    }

    let dy = piece.movement[0][0];
    let dx = piece.movement[0][1];
    let tary = click.y + dy;
    let tarx = click.x + dx;

    if (tary >= 0 && tary < 8 && tarx >= 0 && tarx < 8 && this.grid[tary][tarx] == null) {
      legalmoves.push({x: tarx, y: tary});
    }

    if ((piece.color == "w" && click.y == 6) || (piece.color == "b" && click.y == 1)) {
      tary += dy;
      tarx += dx;
      if (tary >= 0 && tary < 8 && tarx >= 0 && tarx < 8 && this.grid[tary][tarx] == null) {
        legalmoves.push({x: tarx, y: tary});
      }
    }
    return legalmoves;
  }

  clone() {
    const newBoard = new Board(
        this.grid.map(row => row.slice()),
        this.whitePieces.map(piece => ({...piece})),
        this.blackPieces.map(piece => ({...piece})),
        this.isBlackTurn,
        [...this.highlighter]
    );
    return newBoard;
  }
}

function getBoardFromFEN(FEN, isBlackTurn) {
  let grid = Array(8).fill(null).map(() => Array(8).fill(null));
  let highlighter = [];
  let whitePieces = [];
  let blackPieces = [];
  let counter = 0;
  for (let i = 0; i < 8; i++) {
    let j = 0;
    while (j < 8) {
      let char = FEN.charAt(counter);
      if (!isNaN(char)) {
        j += Number(char);
      }
      else {
        if (char == char.toLowerCase()) {
          grid[i][j] = makePiece(char, "b");
          blackPieces.push(generatePosition(i, j));
        }
        else {
          char = char.toLowerCase();
          grid[i][j] = makePiece(char, "w");
          whitePieces.push(generatePosition(i, j));
        }
        j++;
      }
      counter++;
    }
    counter++;
  }
  return new Board(grid, whitePieces, blackPieces, isBlackTurn, highlighter);
}

class Piece {
  constructor(type, color, movement) {
    this.type = type;
    this.color = color;
    this.movement = movement;
  }

  isSliding() {
    return this.type == "b" || this.type == "q" || this.type == "r";
  }
}

function makePiece(id, color) {
  if (id == "p") {
    let dir = color == "b" ? 1 : -1;
    return new Piece("p", color, [[dir, 0], [dir, 1], [dir, -1]]);
  }
  else if (id == "n") {
    return new Piece("n", color, [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]);
  }
  else if (id == "b") {
    return new Piece("b", color, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  }
  else if (id == "r") {
    return new Piece("r", color, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
  }
  else if (id == "q") {
    return new Piece("q", color, [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]);
  }
  else if (id == "k") {
    return new Piece("k", color, [[1, 1], [1, 0], [1, -1], [0, 1], [0, -1], [-1, 1], [-1, 0], [-1, -1]]);
  }
}

function generatePosition(y, x) {
  return {y: y, x: x};
}

function getImgFromPiece(piece) {
  if (piece == null) {
    return <></>
  }
  else {
    let n = piece.color == "w" ? 0 : 1;
    return (<img position={{x: 0, y: 0}} draggable="false" className="square img" src={"/images/" + piece.type + "_" + n + ".png"}/>);
  }
}