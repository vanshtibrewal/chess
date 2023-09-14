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

function Board({ board }) {
  let b = [];
  let row;
  let p = new Piece();
  for (let i = 0; i < 8; i++) {
    row = [];
    for (let j = 0; j < 8; j++) {
      row.push(<Square parity={(i + j) % 2 == 0} piece={board[i][j].piece} highlighted={board[i][j].highlighted} key={j}/>);
    }
    b.push(<div className="board-row" key={i}>{row}</div>);
  }
  return (<>{b}</>);
}

export default function Game() {
  const [board, setBoard] = useState(getBoardFromFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"));
  // const [board, setBoard] = useState(getBoardFromFEN("rnbqkbnr/8/8/8/8/8/8/RNBQKBNR"));
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
    if (board[click.y][click.x].piece != null) {
      let p = board[click.y][click.x].piece;
      let highlight = p.getLegalMoveSet(board, {x: click.x, y: click.y});
      for (let i = 0; i < highlight.length; i++) {
        board[highlight[i].y][highlight[i].x].highlighted = true;
      }
    }
  }

  function onRelease() {
    let click = {y: Math.floor(localMousePos.y/100), x: Math.floor(localMousePos.x/100)};
    click.y = click.y < 0 ? 0 : click.y;
    click.y = click.y > 7 ? 7 : click.y;
    click.x = click.x < 0 ? 0 : click.x;
    click.x = click.x > 7 ? 7 : click.x;

    if (board[click.y][click.x].highlighted) {
      let newBoard = board.slice();
      newBoard[click.y][click.x].piece = newBoard[clicked.y][clicked.x].piece;
      newBoard[clicked.y][clicked.x].piece = null;
      setBoard(newBoard);
    }

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        board[i][j].highlighted = false;
      }
    }
  }

  return (
    <div className="game">
      <div onMouseDown={onClick} onMouseUp={onRelease} className="game-board" onMouseMove={handleMouseMove}>
        <Board board={board}/>
      </div>
    </div>
  );
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

  getLegalMoveSet(board, position) {
    if (this.isSliding()) {
      return this.getSlidingMoveSet(board, position);
    }
    else {
      if (this.type == "n") {
        return this.getKnightMoveSet(board, position);
      }
      else if (this.type == "p") {
        return this.getPawnMoveSet(board, position);
      }
      else {
        return []
      }
    }
  }

  getSlidingMoveSet(board, position) {
    let legalmoves = [];
      for (let i = 0; i < this.movement.length; i++) {
        let dy = this.movement[i][0];
        let dx = this.movement[i][1];
        let curry = position.y + dy;
        let currx = position.x + dx;
        while (curry >= 0 && curry < 8 && currx >= 0 && currx < 8 && board[curry][currx].piece == null) {
          legalmoves.push({x: currx, y: curry});
          curry += dy;
          currx += dx;
        }
        if (curry >= 0 && curry < 8 && currx >= 0 && currx < 8 && board[curry][currx].piece.color != this.color) {
          legalmoves.push({x: currx, y: curry});
        }
      }
      return legalmoves;
  }

  getKnightMoveSet(board, position) {
    let legalmoves = [];
    for (let i = 0; i < this.movement.length; i++) {
      let tary = position.y + this.movement[i][0];
      let tarx = position.x + this.movement[i][1];
      if (tary >= 0 && tary < 8 && tarx >= 0 && tarx < 8 && (board[tary][tarx].piece == null || board[tary][tarx].piece.color != this.color)) {
        legalmoves.push({x: tarx, y: tary});
      }
    }
    return legalmoves;
  }

  getPawnMoveSet(board, position) {
    let legalmoves = [];
    
    for (let i = 1; i < this.movement.length; i++){
      let tary = position.y + this.movement[i][0];
      let tarx = position.x + this.movement[i][1];
      if (tary >= 0 && tary < 8 && tarx >= 0 && tarx < 8 && board[tary][tarx].piece != null && board[tary][tarx].piece.color != this.color) {
        legalmoves.push({x: tarx, y: tary});
      }
    }

    let dy = this.movement[0][0];
    let dx = this.movement[0][1];
    let tary = position.y + dy;
    let tarx = position.x + dx;

    if (tary >= 0 && tary < 8 && tarx >= 0 && tarx < 8 && board[tary][tarx].piece == null) {
      legalmoves.push({x: tarx, y: tary});
    }

    if ((this.color == "w" && position.y == 6) || (this.color == "b" && position.y == 1)) {
      tary += dy;
      tarx += dx;
      if (tary >= 0 && tary < 8 && tarx >= 0 && tarx < 8 && board[tary][tarx].piece == null) {
        legalmoves.push({x: tarx, y: tary});
      }
    }
    return legalmoves;
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

function getBoardFromFEN(FEN) {
  let board = Array(8).fill(null).map(() => Array(8).fill(null).map(() => ({piece: null, highlighted: false})));
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
          board[i][j] = {piece: makePiece(char, "b"), highlighted: false};
        }
        else {
          char = char.toLowerCase();
          board[i][j] = {piece: makePiece(char, "w"), highlighted: false};
        }
        j++;
      }
      counter++;
    }
    counter++;
  }
  return board;
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