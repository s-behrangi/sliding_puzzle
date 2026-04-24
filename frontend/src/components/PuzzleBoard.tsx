import React, { useState } from 'react';
import Tile from './SortableTile.tsx';
import type { Dispatch, SetStateAction } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';

interface PuzzleBoardProps {
    board: number[];
    setBoard: Dispatch<SetStateAction<number[]>>;
    n: number;
    onTileClick: (n: number) => void;
    draggable: boolean;
    isAnimating?: boolean;
    isSolved?: boolean;
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
    board,
    setBoard,
    n,
    onTileClick,
    draggable,
    isAnimating,
}) => {
    const [activeId, setActiveId] = useState(null);

    const enabledSensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: !draggable ? { delay: Infinity, tolerance: 0} : undefined } ),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        }));

    const handleDragStart = (event: DragStartEvent) => {
        if (draggable) {
            setActiveId((event as any).active.id);
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        if (draggable) {
            setActiveId(null);
            const { active, over } = (event as any);

            if (active.id !== over.id) {
                setBoard(prev => {
                    const oldIdx = prev.indexOf(active.id);
                    const newIdx = prev.indexOf(over.id);

                    const newBoard = [...prev]

                    newBoard[oldIdx] = over.id;
                    newBoard[newIdx] = active.id;

                    return newBoard;
                });
            }
        }
    };

    if (draggable) {
        return (
            <DndContext
            sensors={enabledSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            >
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
                    <SortableContext 
                    items={board} 
                    strategy={rectSortingStrategy}
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
                        <DragOverlay>
                            {activeId ? (
                                <Tile 
                                    key={activeId}
                                    val={activeId}
                                    idx={0}
                                    n={n}
                                    onClick={() => {}}
                                    isAnimating={true}
                                    board={board}
                                />
                                ) : null}
                        </DragOverlay>
                    </SortableContext>
                </div>
            </DndContext>
        );
    }


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