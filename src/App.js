import { useState } from 'react';
import Draggable from 'react-draggable';
import { Board } from './Board.js'
import { Piece, makePiece } from './Piece.js'

function Square({ parity, piece, highlighted }) {
  let base = (parity ? "light" : "dark");
  let color;
  if (highlighted == 2) {
    color = base + "-prev";
  }
  else if (highlighted == 1) {
    color = base + "-highlight";
  }
  else {
    color = base;
  }
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
  let prev = [];

  if (board.lastmove != null) {
    let lastmov = board.lastmove;
    prev.push({x: lastmov.old_x, y: lastmov.old_y});
    prev.push({x: lastmov.new_x, y: lastmov.new_y});
  }

  function createSquares(i, j) {
    let highlighted;
    if (board.highlighter.some(position => (position.y == i && position.x == j))) {
      highlighted = 1;
    }
    else if (prev.some(position => (position.y == i && position.x == j))) {
      highlighted = 2;
    }
    else {
      highlighted = 0;
    }
    row.push(<Square parity={(i + j) % 2 == 0} piece={board.grid[i][j]} highlighted={highlighted} key={j}/>);
  }

  function rowPush(i) {
    b.push(<div className="board-row" key={i}>{row}</div>);
  }
  if (!board.isBlackTurn) {
    for (let i = 0; i < 8; i++) {
      row = [];
      for (let j = 0; j < 8; j++) { 
        createSquares(i, j);
      }
      rowPush(i);
    }
  }
  else {
    for (let i = 7; i >= 0; i--) {
      row = [];
      for (let j = 7; j >= 0; j--) { 
        createSquares(i, j);
      }
      rowPush(i);
    }
  }
  return (<>{b}</>);
}

export default function Game() {
  // const [board, setBoard] = useState(getBoardFromFEN("2Q2bnr/4p1pq/5pkr/7p/7P/4P3/PPPP1PP1/RNB1KBNR", false));
  const [board, setBoard] = useState(getBoardFromFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", false));
  const [localMousePos, setLocalMousePos] = useState({});
  const [clicked, setClicked] = useState({});
  const [promoting, setPromoting] = useState(null);

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
    setBoard((prevboard) => prevboard.highlight(prevboard.getLegalMoveSet(click)));
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
      console.log("checkmate");
    }
    else if (out == "s") {
      console.log("stalemate");
    }
    setPromoting(null);
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
        let last = board.isBlackTurn ? 7 : 0;
        let newboard = board.makeMove(clicked, click);
        if (newboard.grid[click.y][click.x].type == "p" && click.y == last) {
          setPromoting({y: click.y, x: click.x});
        }
        else {
          let out = isCheckOrStaleMate(newboard);
          if (out == "s") {
            console.log("stalemate");
          }
          else if (out == "c") {
            console.log("checkmate")
          }
        }
        return newboard;
      }
      else {
        return board.resetHighlight();
      }
    }

    setBoard((prevboard) => checkandmove(prevboard))
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

function getImgFromPiece(piece) {
  if (piece == null) {
    return <></>
  }
  else {
    let n = piece.color == "w" ? 0 : 1;
    return (<img position={{x: 0, y: 0}} draggable="false" className="square img" src={"/images/" + piece.type + "_" + n + ".png"}/>);
  }
}