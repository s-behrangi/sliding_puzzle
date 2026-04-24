import React from 'react';
import Tile from './Tile.tsx';

interface PuzzleBoardProps {
    board: number[];
    n: number;
    onTileClick: (n: number) => void;
    isAnimating?: boolean;
    isSolved?: boolean;
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
    board,
    n,
    onTileClick,
    isAnimating,
}) => {
    return (
        <div
          className="puzzle-board"
          style={{
            height: '500px',
            display: 'grid',
            aspectRatio: '1/1',
            gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
            background: 'var(--puzzle-bg)',
            borderStyle: 'solid',
            borderTopColor: 'var(--puzzle-border-dark)',
            borderLeftColor: 'var(--puzzle-border-dark)',
            borderRightColor: 'var(--puzzle-border-light)',
            borderBottomColor: 'var(--puzzle-border-light)',
            boxShadow: 'inset 0 2px 4px var(--puzzle-border-shadow)',
            boxSizing: 'border-box',
            borderRadius: '2px',
          }}
        >
            {board.map((val, idx) => (
                <Tile 
                    key={`tile-${idx}`}
                    val={val}
                    idx={idx}
                    n={n}
                    onClick={onTileClick}
                    isAnimating={isAnimating}
                    board={board}
                />
            ))}
        </div>
    );
};

export default React.memo(PuzzleBoard);