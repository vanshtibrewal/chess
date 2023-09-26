import Draggable from 'react-draggable';

export function Square({ parity, piece, highlighted }) {
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

  function getImgFromPiece(piece) {
    if (piece == null) {
      return <></>
    }
    else {
      let n = piece.color == "w" ? 0 : 1;
      return (<img position={{x: 0, y: 0}} draggable="false" className="square img" src={"/images/" + piece.type + "_" + n + ".png"}/>);
    }
  }