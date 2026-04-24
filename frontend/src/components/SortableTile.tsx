import React, { useCallback } from 'react';
import { useSortable } from "@dnd-kit/sortable";
import styles from './Tile.module.css';

interface TileProps {
    val: number;
    idx: number;
    n: number;
    onClick: (n: number) => void;
    isAnimating?: boolean;
    board: number[];
}

const Tile: React.FC<TileProps> = ({
    val,
    idx,
    n,
    onClick,
    isAnimating = false,
    board,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        isDragging
    } = useSortable({ id: val });

    const isEmpty = val === 0;

    const isInteractive = !isEmpty && !isAnimating;

    const handleClick = useCallback(() => {
        if (isInteractive) {
            onClick(val);
        }
    }, [isInteractive, board])

    const tileClasses = [
        styles.tile,
        (isEmpty || isDragging) ? styles.empty : styles.filled,
        !isInteractive && styles.disabled,
    ].filter(Boolean).join(' ');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick(val);
        }
    };

    return (
        <div
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className={tileClasses}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role={isEmpty ? 'presentation' : 'button'}
          tabIndex={isInteractive ? 0 : -1}
          aria-label={isEmpty ? undefined : `Tile ${val}`}
          aria-disabled={!isInteractive}
          style={{ '--tile-index': idx, 'borderWidth': 40/n, 'borderRadius': 20/n} as React.CSSProperties}
        >
            {(!isEmpty && !isDragging) && <span className={styles.number} style={{ 'fontSize': 200/n } as React.CSSProperties}>{val}</span>}
        </div>
    );
};

export default React.memo(Tile, (prevProps, nextProps) => {
    return (
        prevProps.val === nextProps.val &&
        prevProps.idx === nextProps.idx &&
        prevProps.n === nextProps.n &&
        prevProps.isAnimating === nextProps.isAnimating
    );
});