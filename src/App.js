import { useState } from 'react';
import Draggable from 'react-draggable';

function Square({ onSquareClick, parity, piece }) {
  return (
    <div className={"square " + (parity ? "light" : "dark")}>
      <Draggable onStart={()=>{console.log("START")}} onStop={()=>{console.log("END")}}>
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
      row.push(<Square onSquareClick={() => handleClick(0)} parity={(i + j) % 2 == 0} piece={board[i][j]} key={j}/>);
    }
    b.push(<div className="board-row" key={i}>{row}</div>);
  }
  return (<>{b}</>);
}

export default function Game() {
  const [board, setBoard] = useState(getBoardFromFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"));
  return (
    <div className="game">
      <div className="game-board">
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
  let board = Array(8).fill(null).map(() => Array(8).fill(null));
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
          board[i][j] = makePiece(char, "b");
        }
        else {
          char = char.toLowerCase();
          board[i][j] = makePiece(char, "w");
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
    return (<img draggable="false" className="square img" src={"/images/" + piece.type + "_" + n + ".png"}/>);
  }
}