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
            gap: '6px',
            padding: '4px',
            background: 'var(--puzzle-bg)',
            borderStyle: 'inset',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
            boxSizing: 'border-box',
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