import { useState, useCallback, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { moveZero, canMoveBoard } from '../utils/puzzleUtils.ts';

interface SolutionState {
    startingBoard: number[];
    solution: number[];
    idx: number;
}

export interface Solutions {
    astar: SolutionState;
    idastar: SolutionState;
    precomp: SolutionState;
    reduction: SolutionState;
}

type SolutionKey = 'astar' | 'idastar' | 'precomp' | 'reduction';

export function useSolution(
    setBoard: Dispatch<SetStateAction<number[]>>,
) {
    const [solutions, setSolutions] = useState<Solutions>({
         astar: { startingBoard: [], solution: [], idx: -1 },
         idastar: { startingBoard: [], solution: [], idx: -1 },
         precomp: { startingBoard: [], solution: [], idx: -1 },
         reduction: { startingBoard: [], solution: [], idx: -1 },
    });
    const [playbackActive, setPlaybackActive] = useState<boolean>(false);
    const [playbackType, setPlaybackType] = useState<string>('none');
    const [playbackSpeed, setPlaybackSpeed] = useState(0);
    const reversals = [1, 0, 3, 2];
    const speeds = [800, 150, 50];
    let intervalId = useRef<ReturnType<typeof setTimeout> | null>(null);

    const strToKey = (s: string): SolutionKey => {
        switch (s) {
            case 'astar':
                return 'astar';
            case 'idastar':
                return 'idastar';
            case 'reduction':
                return 'reduction';
            default:
                return 'precomp';
        }
    }

    /*  PLAYBACK FUNCTIONS */

    const pause = () => {
        if (intervalId.current !== null) {
            setPlaybackActive(false);
            setPlaybackType('none');
            setPlaybackSpeed(0);
            clearInterval(intervalId.current);
            intervalId.current = null;
            return true;
        }
        return false
    };

    const reset = useCallback((
        sol: string,
    ) => {
        pause()
        const key = strToKey(sol);
        setBoard(prev => {
            if (solutions[key].startingBoard.length === prev.length) {
                return solutions[key].startingBoard
            }
            return prev
        });
        resetIdx(sol);
    }, [solutions])

    const stepSol = useCallback((
        sol: string
    ) => {
        if (pause()) return
        setSolutions( prev => {
            const key = strToKey(sol);
            const oldIdx = prev[key].idx;

            if (oldIdx === prev[key].solution.length - 1) return prev;

            const newIdx = oldIdx + 1;
            const move = prev[key].solution[newIdx];

            setBoard( prevBoard => {
                if (canMoveBoard(prevBoard, move)) {
                    return moveZero(prevBoard, move);
                } else {
                    return prevBoard;
                }
            })

            return {
                ...prev,
                [key] : {
                    ...prev[key],
                    idx: newIdx,
                } }
            }
        )
    }, [solutions])

    const playSol = useCallback((
        sol: string,
        speed: number,
    ) => {
        const key = strToKey(sol);
        pause();
        
        const solution = [...solutions[key].solution];
        
        let idx = solutions[key].idx;
        if (idx === solution.length - 1 || solution.length === 0) return

        setPlaybackActive(true);
        setPlaybackType(sol);
        setPlaybackSpeed(speed + 1);

        let delay = speeds[speed];

        intervalId.current = setInterval(() => {
            idx++
            const move = solution[idx];
            setBoard(prev => {
                if (canMoveBoard(prev, move)) {
                    changeIdx(sol, 1);
                    return moveZero(prev, move);
                }
                pause();
                return prev;
            });
        }, delay)
    }, [solutions])

    const revSol = useCallback((
        sol: string,
        speed: number,
    ) => {
        const key = strToKey(sol);
        pause();
        
        const solution = [...solutions[key].solution];
        
        let idx = solutions[key].idx;
        if (idx === -1 || solution.length === 0) return

        setPlaybackActive(true);
        setPlaybackType(sol);
        setPlaybackSpeed((speed + 1) * -1);

        let delay = speeds[speed];

        intervalId.current = setInterval(() => {
            const move = reversals[solution[idx]];
            setBoard(prev => {
                if (canMoveBoard(prev, move)) {
                    changeIdx(sol, -1);
                    return moveZero(prev, move);
                }
                pause();
                return prev;
            });
            idx--;
        }, delay)
    }, [solutions])

    useEffect(() => {
        if (playbackType !== 'none') {
            const key = strToKey(playbackType);
            if ((solutions[key].idx == solutions[key].solution.length - 1 || solutions[key].idx == -1) && intervalId.current !== null) {
                pause();
            }
        }
    }, [solutions])

    const stepSolBack = useCallback((
        sol: string
    ) => {
        if (pause()) return
        setSolutions( prev => {
            const key = strToKey(sol);
            const oldIdx = prev[key].idx;

            if (oldIdx === -1) return prev;
            
            const move = reversals[prev[key].solution[oldIdx]];
            const newIdx = oldIdx - 1;

            setBoard( prevBoard => {
                if (canMoveBoard(prevBoard, move)) {
                    return moveZero(prevBoard, move);
                } else {
                    return prevBoard;
                }
            })

            return {
                ...prev,
                [key] : {
                    ...prev[key],
                    idx: newIdx,
                } }
            }
        )
    }, [solutions])

    const updateSolution = useCallback((
        s: string,
        newSolution: Partial<Omit<Solutions[SolutionKey], 'idx'>>
    ) =>  {
        const key = strToKey(s);
        setSolutions(prev => ({
            ...prev,
            [key] : {
                ...newSolution,
                idx: -1,
            }
        }))
    }, [])

    const changeIdx = (
        s: string,
        diff: number
    ) => {
        const key = strToKey(s);
        setSolutions(prev => {
            return {
            ...prev,
            [key] : {
                ...prev[key],
                idx: prev[key].idx + diff,
            } }
        });
    };

    const currentMove = useCallback((
        s: string,
    ) => {
        const key = strToKey(s);
        if (solutions[key].idx === -1) {
            return 4;
        } else {
            return solutions[key].solution[solutions[key].idx];
        }
    }, [solutions]) 

    const getIdx = useCallback((
        s: string,
    ) => {
        const key = strToKey(s);
        return solutions[key].idx;
    }, [solutions])

    const getSol = useCallback((
        s: string,
    ) => {
        const key = strToKey(s);
        return [...solutions[key].solution];
    }, [solutions])

    const getStart = useCallback((
        s: string,
    ) => {
        const key = strToKey(s);
        return [...solutions[key].startingBoard];
    }, [solutions])

    const resetIdx = useCallback((
        s: string,
    ) => {
        const key = strToKey(s);
        solutions[key].idx = -1;
    }, [solutions])
    
    return {
        updateSolution,
        solutions,
        currentMove,
        getIdx,
        getSol,
        getStart,
        resetIdx,
        stepSol,
        stepSolBack,
        playSol,
        revSol,
        reset,
        pause,
        playbackActive,
        playbackType,
        playbackSpeed,
    }
};