import { Square } from "./Square.js"

export function GameBoard({ board }) {
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