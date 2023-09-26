import { useState } from 'react';
import { Board } from './Board.js'
import { GameBoard } from './GameBoard.js';
import { makePiece } from './Piece.js'
import { io } from "socket.io-client"
import { useEffect } from "react";

const socket = io.connect("http://localhost:3001"); // backend/server location

export default function Game() {
  // const [board, setBoard] = useState(getBoardFromFEN("2Q2bnr/4p1pq/5pkr/7p/7P/4P3/PPPP1PP1/RNB1KBNR", false));
  const [board, setBoard] = useState(getBoardFromFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", false));
  const [localMousePos, setLocalMousePos] = useState({});
  const [clicked, setClicked] = useState({});
  const [promoting, setPromoting] = useState(null);

  useEffect(() => {
    let moveHandler = (data) => {
      setBoard((prevboard) => move(prevboard, data.source, data.dest));
    };
    socket.on("receive_move", moveHandler);
    return () => socket.off("receive_move", moveHandler);
  }, [socket]);

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
    if (board.isBlackTurn) {
      click = {x: 7 - click.x, y: 7 - click.y};
    }
    setClicked(click);
    setBoard((prevboard) => {
        let newboard = prevboard.highlight(prevboard.getLegalMoveSet(click));
        return newboard;
      }
    );
  }

  function move(board, source, dest) {
    let last = board.isBlackTurn ? 7 : 0;
    let newboard = board.makeMove(source, dest);
    if (newboard.grid[dest.y][dest.x].type == "p" && dest.y == last) {
      setPromoting({y: dest.y, x: dest.x});
    }
    else {
      let out = isCheckOrStaleMate(newboard);
      if (out == "s") {
        alert("stalemate");
      }
      else if (out == "c") {
        alert("checkmate");
      }
    }
    return newboard;
  }
  
  function onRelease() {
    let click = {y: Math.floor(localMousePos.y/100), x: Math.floor(localMousePos.x/100)};
    click.y = click.y < 0 ? 0 : click.y;
    click.y = click.y > 7 ? 7 : click.y;
    click.x = click.x < 0 ? 0 : click.x;
    click.x = click.x > 7 ? 7 : click.x;
    if (board.isBlackTurn) {
      click = {x: 7 - click.x, y: 7 - click.y};
    }

    function checkandmove(board) {
      if (board.highlighter.some(position => (position.y == click.y && position.x == click.x))) {
        socket.emit("send_move", {source: clicked, dest: click});
        return move(board, clicked, click);
      }
      else {
        return board.resetHighlight();
      }
    }
    setBoard((prevboard) => checkandmove(prevboard));
  }

  function isCheckOrStaleMate(newboard) {
    let totmoves = 0;
    let ourPieces = newboard.isBlackTurn ? newboard.blackPieces : newboard.whitePieces;
    for (let i = 0; i < ourPieces.length; i++) {
      totmoves += newboard.getLegalMoveSet(ourPieces[i]).length;
    }
    if (totmoves == 0) {
      newboard.isBlackTurn = !newboard.isBlackTurn;
      if (newboard.canKillKing()) {
        newboard.isBlackTurn = !newboard.isBlackTurn;
        return "c";
      }
      else {
        newboard.isBlackTurn = !newboard.isBlackTurn;
        return "s";
      }
    }
    else {
      return "n";
    }
  }

  function promotePawn(type) {
    let pawnloc = promoting;
    board.grid[pawnloc.y][pawnloc.x] = makePiece(type, board.isBlackTurn ? "w" : "b");
    board.grid[pawnloc.y][pawnloc.x].hasmoved = true;
    let out = isCheckOrStaleMate(board);
    if (out == "c") {
      alert("checkmate");
    }
    else if (out == "s") {
      alert("stalemate");
    }
    setPromoting(null);
  }
  
  let promotionmenu;
  if (promoting == null) {
    promotionmenu = (<></>)
  }
  else {
    promotionmenu = (<ol> Promote pawn to:
      <li key="queen">
        <button onClick={() => promotePawn("q")}>queen</button> 
      </li>
      <li key="rook">
        <button onClick={() => promotePawn("r")}>rook</button> 
      </li>
      <li key="bishop">
        <button onClick={() => promotePawn("b")}>bishop</button> 
      </li>
      <li key="knight">
        <button onClick={() => promotePawn("n")}>knight</button> 
      </li>
    </ol>)
  }
  return (
    <div className="game">
      <div onMouseDown={promoting == null ? onClick : null} onMouseUp={promoting == null ? onRelease : null} className="game-board" onMouseMove={handleMouseMove}>
        <GameBoard board={board}/>
      </div>
      <div className="game-info">
        {promotionmenu}
      </div>
    </div>
  );
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
  return new Board(grid, whitePieces, blackPieces, isBlackTurn, highlighter, null);
}

function generatePosition(y, x) {
  return {y: y, x: x};
}