import { Piece, makePiece } from './Piece.js'

export class Board {
    constructor(grid, whitePieces, blackPieces, isBlackTurn, highlighter, lastmove) {
      this.grid = grid;
      this.highlighter = highlighter;
      this.whitePieces = whitePieces;
      this.blackPieces = blackPieces;
      this.isBlackTurn = isBlackTurn;
      this.lastmove = lastmove;
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
      newboard.grid[oldPos.y][oldPos.x].hasmoved = true;
      let enpassant = newboard.grid[oldPos.y][oldPos.x].type == "p" && oldPos.x != newPos.x && newboard.grid[newPos.y][newPos.x] == null;
      let kscastle = newboard.grid[oldPos.y][oldPos.x].type == "k" && newPos.x == oldPos.x + 2;
      let qscastle = newboard.grid[oldPos.y][oldPos.x].type == "k" && newPos.x == oldPos.x - 2;
      if (newboard.isBlackTurn) {
        newboard.blackPieces = newboard.blackPieces.filter((piece)=>{return !(piece.y == oldPos.y && piece.x == oldPos.x)})
        newboard.blackPieces.push(newPos);
        if (enpassant) {
          newboard.whitePieces = newboard.whitePieces.filter((piece)=>{return !(piece.y == (newPos.y - 1) && piece.x == newPos.x)});
        }
        else if (kscastle) {
          newboard.blackPieces = newboard.blackPieces.filter((piece)=>{return !(piece.y == newPos.y && piece.x == newPos.x + 1)})
          newboard.blackPieces.push({y: newPos.y, x: newPos.x - 1})
        }
        else if (qscastle) {
          newboard.blackPieces = newboard.blackPieces.filter((piece)=>{return !(piece.y == newPos.y && piece.x == newPos.x - 2)})
          newboard.blackPieces.push({y: newPos.y, x: newPos.x + 1})
        }
        else {
          newboard.whitePieces = newboard.whitePieces.filter((piece)=>{return !(piece.y == newPos.y && piece.x == newPos.x)});
        }
      }
      else {
        newboard.whitePieces = newboard.whitePieces.filter((piece)=>{return !(piece.y == oldPos.y && piece.x == oldPos.x)})
        newboard.whitePieces.push(newPos);
        if (enpassant) {
          newboard.blackPieces = newboard.blackPieces.filter((piece)=>{return !(piece.y == (newPos.y + 1) && piece.x == newPos.x)});
        }
        else if (kscastle) {
          newboard.whitePieces = newboard.whitePieces.filter((piece)=>{return !(piece.y == newPos.y && piece.x == newPos.x + 1)})
          newboard.whitePieces.push({y: newPos.y, x: newPos.x - 1})
        }
        else if (qscastle) {
          newboard.whitePieces = newboard.whitePieces.filter((piece)=>{return !(piece.y == newPos.y && piece.x == newPos.x - 2)})
          newboard.whitePieces.push({y: newPos.y, x: newPos.x + 1})
        }
        else {
          newboard.blackPieces = newboard.blackPieces.filter((piece)=>{return !(piece.y == newPos.y && piece.x == newPos.x)});
        }
      }
      newboard.lastmove = {
        old_x: oldPos.x,
        old_y: oldPos.y,
        new_x: newPos.x,
        new_y: newPos.y,
      };
      newboard.grid[newPos.y][newPos.x] = newboard.grid[oldPos.y][oldPos.x];
      newboard.grid[oldPos.y][oldPos.x] = null;
      if (enpassant) {
        let back = newboard.isBlackTurn ? -1 : 1;
        newboard.grid[newPos.y + back][newPos.x] = null;
      }
      else if (kscastle) {
        newboard.grid[newPos.y][newPos.x - 1] = newboard.grid[newPos.y][newPos.x + 1];
        newboard.grid[newPos.y][newPos.x + 1] = null;
      }
      else if (qscastle) {
        newboard.grid[newPos.y][newPos.x + 1] = newboard.grid[newPos.y][newPos.x - 2];
        newboard.grid[newPos.y][newPos.x - 2] = null;
      }
      newboard.highlighter = [];
      newboard.isBlackTurn = !newboard.isBlackTurn;
      return newboard;
    }
    
    getNaiveLegalMoveSet(click) {
      let ourpieces = this.isBlackTurn ? this.blackPieces : this.whitePieces;
      if (!ourpieces.some(position => (position.y == click.y && position.x == click.x))) {
        return []
      }
      let piece = this.grid[click.y][click.x];
      if (piece.isSliding()) {
        return this.getSlidingMoveSet(click);
      }
      else {
        if (piece.type == "n" || piece.type == "k") {
          return this.getKMoveSet(click);
        }
        else if (piece.type == "p") {
          return this.getPawnMoveSet(click);
        }
        else {
          return []
        }
      }
    }
  
    getLegalMoveSet(click) {
      let ourpieces = this.isBlackTurn ? this.blackPieces : this.whitePieces;
      if (!ourpieces.some(position => (position.y == click.y && position.x == click.x))) {
        return []
      }
      let out = [];
      let moves = this.getNaiveLegalMoveSet(click);
      for (let i = 0; i < moves.length; i++) {
        if (!this.makeMove(click, moves[i]).canKillKing()) {
          out.push(moves[i]);
        }
      }
      if (this.grid[click.y][click.x].type == "k") {
        out = this.canCastle(out, click);
      }
      return out;
    }
  
    canCastle(out, click) {
      let king = this.grid[click.y][click.x];
      if (king.hasmoved) {
        return out;
      }
      out = this.canCastleKingside(out, click);
      out = this.canCastleQueenside(out, click);
      return out;
    }
  
    canCastleKingside(out, click) {
      let piece = this.grid[click.y][click.x];
      let kingside = this.grid[click.y][click.x + 3];
  
      if (kingside == null || kingside.type != "r" || kingside.color != piece.color || kingside.hasmoved) {
        return out;
      }
  
      if (this.grid[click.y][click.x + 1] != null || this.grid[click.y][click.x + 2] != null) {
        return out;
      }
  
      let wasBlackTurn = this.isBlackTurn;
      this.isBlackTurn = !wasBlackTurn;
  
      if (this.canKillKing()) {
        this.isBlackTurn = wasBlackTurn;
        return out;
      }
  
      this.grid[click.y][click.x + 1] = this.grid[click.y][click.x];
      this.grid[click.y][click.x] = null;
  
      if (this.canKillKing()) {
        this.isBlackTurn = wasBlackTurn;
        this.grid[click.y][click.x] = this.grid[click.y][click.x + 1];
        this.grid[click.y][click.x + 1] = null;
        return out;
      }
  
      this.grid[click.y][click.x + 2] = this.grid[click.y][click.x + 1];
      this.grid[click.y][click.x + 1] = this.grid[click.y][click.x + 3];
      this.grid[click.y][click.x + 3] = null;
      if (this.canKillKing()) {
        this.isBlackTurn = wasBlackTurn;
        this.grid[click.y][click.x] = this.grid[click.y][click.x + 2];
        this.grid[click.y][click.x + 2] = null;
        this.grid[click.y][click.x + 3] = this.grid[click.y][click.x + 1];
        this.grid[click.y][click.x + 1] = null;
        return out;
      }
      this.isBlackTurn = wasBlackTurn;
      this.grid[click.y][click.x] = this.grid[click.y][click.x + 2];
      this.grid[click.y][click.x + 2] = null;
      this.grid[click.y][click.x + 3] = this.grid[click.y][click.x + 1];
      this.grid[click.y][click.x + 1] = null;
      out.push({x: click.x + 2, y: click.y});
      return out;
    }
  
    canCastleQueenside(out, click) {
      let piece = this.grid[click.y][click.x];
      let queenside = this.grid[click.y][click.x - 4];
  
      if (queenside == null || queenside.type != "r" || queenside.color != piece.color || queenside.hasmoved) {
        return out;
      }
  
      if (this.grid[click.y][click.x - 1] != null || this.grid[click.y][click.x - 2] != null || this.grid[click.y][click.x - 3] != null) {
        return out;
      }
  
      let wasBlackTurn = this.isBlackTurn;
      this.isBlackTurn = !wasBlackTurn;
  
      if (this.canKillKing()) {
        this.isBlackTurn = wasBlackTurn;
        return out;
      }
  
      this.grid[click.y][click.x - 1] = this.grid[click.y][click.x];
      this.grid[click.y][click.x] = null;
  
      if (this.canKillKing()) {
        this.isBlackTurn = wasBlackTurn;
        this.grid[click.y][click.x] = this.grid[click.y][click.x - 1];
        this.grid[click.y][click.x - 1] = null;
        return out;
      }
  
      this.grid[click.y][click.x - 2] = this.grid[click.y][click.x - 1];
      this.grid[click.y][click.x - 1] = this.grid[click.y][click.x - 4];
      this.grid[click.y][click.x - 4] = null;
      if (this.canKillKing()) {
        this.isBlackTurn = wasBlackTurn;
        this.grid[click.y][click.x] = this.grid[click.y][click.x - 2];
        this.grid[click.y][click.x - 2] = null;
        this.grid[click.y][click.x - 4] = this.grid[click.y][click.x - 1];
        this.grid[click.y][click.x - 1] = null;
        return out;
      }
      this.isBlackTurn = wasBlackTurn;
      this.grid[click.y][click.x] = this.grid[click.y][click.x - 2];
      this.grid[click.y][click.x - 2] = null;
      this.grid[click.y][click.x - 4] = this.grid[click.y][click.x - 1];
      this.grid[click.y][click.x - 1] = null;
      out.push({x: click.x - 2, y: click.y});
      return out;
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
  
    getKMoveSet(click) {
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
        if (tary >= 0 && tary < 8 && tarx >= 0 && tarx < 8) {
          let enpassant = this.grid[tary][tarx] == null && this.grid[click.y][tarx] != null && this.grid[click.y][tarx].type == "p" && this.grid[click.y][tarx].color != piece.color && this.lastmove.new_x == tarx && this.lastmove.new_y == click.y && this.lastmove.old_x == tarx && this.lastmove.old_y == tary + piece.movement[i][0];
          if ((this.grid[tary][tarx] != null && this.grid[tary][tarx].color != piece.color) || enpassant) {
            legalmoves.push({x: tarx, y: tary});
          }
        }
      }
  
      let dy = piece.movement[0][0];
      let dx = piece.movement[0][1];
      let tary = click.y + dy;
      let tarx = click.x + dx;
  
      if (tary >= 0 && tary < 8 && tarx >= 0 && tarx < 8 && this.grid[tary][tarx] == null) {
        legalmoves.push({x: tarx, y: tary});
      }
  
      if (((piece.color == "w" && click.y == 6) || (piece.color == "b" && click.y == 1)) && this.grid[tary][tarx] == null) {
        tary += dy;
        tarx += dx;
        if (tary >= 0 && tary < 8 && tarx >= 0 && tarx < 8 && this.grid[tary][tarx] == null) {
          legalmoves.push({x: tarx, y: tary});
        }
      }
      return legalmoves;
    }
  
    canKillKing() {
      let ourPieces = this.isBlackTurn ? this.blackPieces : this.whitePieces;
      for (let i = 0; i < ourPieces.length; i++) {
        let pos = ourPieces[i];
        let moves = this.getNaiveLegalMoveSet(pos);
        for (let j = 0; j < moves.length; j++) {
          if (this.grid[moves[j].y][moves[j].x] != null && this.grid[moves[j].y][moves[j].x].type == "k") {
            return true;
          }
        }
      }
      return false;
    }
  
    clone() {
      const newBoard = new Board(
          this.grid.map(row => row.map(piece => (piece ? new Piece(piece.type, piece.color, piece.movement, piece.hasmoved) : null))),
          this.whitePieces.map(piece => ({...piece})),
          this.blackPieces.map(piece => ({...piece})),
          this.isBlackTurn,
          [...this.highlighter],
          {...this.lastmove}
      );
      return newBoard;
    }
  }