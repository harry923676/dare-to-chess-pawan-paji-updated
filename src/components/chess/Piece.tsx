import blackBishop from "@/assets/chess/b-b.png";
import blackKing from "@/assets/chess/b-k.png";
import blackKnight from "@/assets/chess/b-n.png";
import blackPawn from "@/assets/chess/b-p.png";
import blackQueen from "@/assets/chess/b-q.png";
import blackRook from "@/assets/chess/b-r.png";
import whiteBishop from "@/assets/chess/w-b.png";
import whiteKing from "@/assets/chess/w-k.png";
import whiteKnight from "@/assets/chess/w-n.png";
import whitePawn from "@/assets/chess/w-p.png";
import whiteQueen from "@/assets/chess/w-q.png";
import whiteRook from "@/assets/chess/w-r.png";

const PIECES: Record<string, string> = {
  wk: whiteKing, wq: whiteQueen, wb: whiteBishop, wn: whiteKnight, wr: whiteRook, wp: whitePawn,
  bk: blackKing, bq: blackQueen, bb: blackBishop, bn: blackKnight, br: blackRook, bp: blackPawn,
};

interface Props {
  type: string;
  color: "w" | "b";
  setId: string;
  sizePercent?: number;
  board?: boolean;
  className?: string;
}

export function Piece({ type, color, board = false, sizePercent = 100, className }: Props) {
  const src = PIECES[`${color}${type}`];
  const clampedBoardPercent = Math.min(Math.max(sizePercent, 75), 92);
  const inlineSize = board ? `${clampedBoardPercent}%` : `${Math.max(1.3, sizePercent / 80)}em`;

  return (
    <img
      aria-hidden
      alt=""
      className={`chess-piece shrink-0 object-contain ${className ?? ""}`}
      draggable={false}
      src={src}
      style={
        board
          ? {
              width: inlineSize,
              height: inlineSize,
              maxWidth: "94%",
              maxHeight: "94%",
              display: "block",
            }
          : { width: inlineSize, height: inlineSize }
      }
    />
  );
}
