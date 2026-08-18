import { useMemo } from "react";
import type { Chess, Square } from "chess.js";
import { Piece } from "./Piece";
import { cn } from "@/lib/utils";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

interface Props {
  game: Chess;
  orientation: "w" | "b";
  selected: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  checkSquare: Square | null;
  pieceSet: string;
  pieceSize: number;
  showCoordinates: boolean;
  showLegalMoves: boolean;
  showLastMove: boolean;
  interactive: boolean;
  onSquare: (square: Square) => void;
}

export function Board({
  game, orientation, selected, legalTargets, lastMove, checkSquare,
  pieceSet, pieceSize, showCoordinates, showLegalMoves, showLastMove, interactive, onSquare,
}: Props) {
  const squares = useMemo(() => {
    const files = orientation === "w" ? FILES : [...FILES].reverse();
    const ranks = orientation === "w" ? RANKS : [...RANKS].reverse();
    return ranks.flatMap((rank, r) =>
      files.map((file, f) => ({
        id: `${file}${rank}` as Square,
        light: (r + f) % 2 === 0,
        showFile: r === 7,
        showRank: f === 0,
        file,
        rank,
      })),
    );
  }, [orientation]);

  return (
    <div
      className="chess-board relative grid grid-cols-8 grid-rows-8 overflow-hidden rounded-2xl border-2 border-border shadow-[var(--elev)]"
      role="grid"
      aria-label="Chess board"
    >
      {squares.map((sq) => {
        const piece = game.get(sq.id);
        const isTarget = showLegalMoves && legalTargets.includes(sq.id);
        const isLast = showLastMove && (lastMove?.from === sq.id || lastMove?.to === sq.id);
        const isSelected = selected === sq.id;
        const isCheck = checkSquare === sq.id;
        return (
          <button
            key={sq.id}
            type="button"
            role="gridcell"
            disabled={!interactive}
            onClick={() => onSquare(sq.id)}
            aria-label={`${sq.id}${piece ? `, ${piece.color === "w" ? "white" : "black"} ${piece.type}` : ", empty"}${isTarget ? ", legal move" : ""}`}
            className={cn(
              "chess-square relative flex min-h-0 min-w-0 touch-manipulation items-center justify-center transition-colors duration-150",
              sq.light ? "bg-board-light" : "bg-board-dark",
              isSelected && "ring-4 ring-inset ring-[var(--board-select)]",
            )}
            style={{
              backgroundColor: isLast
                ? "color-mix(in oklab, var(--board-last) 45%, transparent)"
                : undefined,
            }}
          >
            {isLast && (
              <span
                aria-hidden
                className="absolute inset-0"
                style={{ background: "color-mix(in oklab, var(--board-last) 30%, transparent)" }}
              />
            )}
            {isCheck && (
              <span
                aria-hidden
                className="absolute inset-0 animate-pulse rounded-sm"
                style={{
                  background:
                    "radial-gradient(circle, color-mix(in oklab, var(--board-check) 75%, transparent) 10%, transparent 72%)",
                }}
              />
            )}
            {showCoordinates && sq.showRank && (
              <span className="pointer-events-none absolute left-0.5 top-0.5 text-[9px] font-semibold opacity-60 sm:text-[10px]">
                {sq.rank}
              </span>
            )}
            {showCoordinates && sq.showFile && (
              <span className="pointer-events-none absolute bottom-0.5 right-0.5 text-[9px] font-semibold opacity-60 sm:text-[10px]">
                {sq.file}
              </span>
            )}
            {piece && (
              <Piece
                type={piece.type}
                color={piece.color}
                setId={pieceSet}
                sizePercent={pieceSize}
                board
                className="relative z-10 select-none"
              />
            )}
            {isTarget && (
              <span
                aria-hidden
                className={cn(
                  "absolute z-20 rounded-full",
                  piece
                    ? "inset-1 border-4 border-[var(--board-select)] opacity-80"
                    : "h-1/4 w-1/4 bg-[var(--board-select)] opacity-70",
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
