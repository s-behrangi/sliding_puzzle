import { useState, useCallback, useEffect } from 'react';
import { isSolved, newBoard, isMovable, moveTile, swapTiles, getDistances } from '../utils/puzzleUtils';
import { useWorker } from './useWorker.ts';
import { useSolution } from './useSolution.ts';

export function useBoard(startN: number = 3) {
    const [board, setBoard] = useState<number[]>(() => newBoard(startN));
    const [n, setN] = useState(startN);
    const [moveCount, setMoveCount] = useState(0);
    const [solved, setSolved] = useState(true);
    const [isActive, setIsActive] = useState<boolean>(false);
    const [distances, setDistances] = useState<number[]>([0, 0, 0]);
    const [solving, setSolving] = useState(0);
    const [draggable, setDraggable] = useState(false);
    const solutions = useSolution(setBoard);

    const worker = useWorker();

    const toggleDrag = useCallback(() => {
        setDraggable(prev => ! prev);
    }, []);

    /* maintain solved state */
    useEffect(() => {
        setSolved(isSolved(board));
    }, [board]);

    /* respond to size updates */
    useEffect(() => {
        setBoard(newBoard(n));
        setMoveCount(0);
        setIsActive(false);
    }, [n])

    /* maintain changes to distances */
    useEffect(() => {
        const hamman = getDistances(board);
        const fetch = async () => {
            try {
                const lin = await worker.distance(board);
                setDistances([hamman[0], hamman[1], lin]);
            } catch (error) {
                console.error("Unable to get linear distance:", error);
            }
        };
        fetch();
    }, [board])

    const reset = useCallback(() => {
        setBoard(newBoard(n));
        setMoveCount(0);
        setIsActive(false);
    }, [n])

    const pushTile = useCallback((val: number) => {
        setBoard(prev => {
            if (isMovable(prev, n, val)) {
                setMoveCount(count => count + 1);
                setIsActive(true);
                return moveTile(prev, val);
            } else {
                return prev;
            }
        })
    }, [n]);

    const switchTiles = useCallback((val1: number, val2: number) => {
        setBoard(prev => swapTiles(prev, val1, val2));
    }, [board]);

    const scrambleBoard = useCallback(async (style: number) => {
        try {
            const newBoard = await worker.scramble(n, style);
            setBoard(newBoard);
            setMoveCount(0);
            setIsActive(false);
        } catch (err) {
            console.error('Scramble failed:', err);
        }
    }, [n])

    const solve = useCallback(async (alg: string) => {
        switch (alg) {
            case 'astar':
                setSolving(1);
                break;
            case 'idastar':
                setSolving(2);
                break;
            case 'precomp':
                setSolving(3);
                break;
            default:
                setSolving(4);
        }
        try {
            const solution = await worker.solve(board, alg);
            solutions.updateSolution(
                alg,
                {
                    startingBoard: [...board], 
                    solution: solution,
                }
            );
        } catch (err) {
            console.error('Solve failed:', err);
        }
        setSolving(0);
    }, [board])

    return {
        board,
        n,
        moveCount,
        solved,
        setN,
        reset,
        pushTile,
        switchTiles,
        scrambleBoard,
        isActive,
        setIsActive,
        solve,
        solutions,
        setBoard,
        distances,
        setMoveCount,
        solving,
        draggable,
        toggleDrag,
    };
}