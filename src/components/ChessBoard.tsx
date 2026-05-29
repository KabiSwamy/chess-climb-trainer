import { Chessboard } from 'react-chessboard';
import type { CSSProperties } from 'react';

interface ChessBoardProps {
  fen: string;
  orientation: 'white' | 'black';
  sideToMove: 'w' | 'b';
  interactive: boolean;
  squareStyles?: Record<string, CSSProperties>;
  onDrop: (sourceSquare: string, targetSquare: string) => boolean;
}

export function ChessBoard({
  fen,
  orientation,
  sideToMove,
  interactive,
  squareStyles,
  onDrop,
}: ChessBoardProps) {
  return (
    <div className="board-wrapper">
      <Chessboard
        options={{
          id: 'climb-board',
          position: fen,
          boardOrientation: orientation,
          allowDragging: interactive,
          animationDurationInMs: 200,
          squareStyles,
          canDragPiece: ({ piece }) =>
            interactive && piece.pieceType.charAt(0) === sideToMove,
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!targetSquare) return false;
            return onDrop(sourceSquare, targetSquare);
          },
          darkSquareStyle: { backgroundColor: '#7c93b0' },
          lightSquareStyle: { backgroundColor: '#e6ebf2' },
        }}
      />
    </div>
  );
}

export default ChessBoard;
