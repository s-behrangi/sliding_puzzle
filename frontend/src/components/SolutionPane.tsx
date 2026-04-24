import React, { useRef, useState, useEffect } from 'react';
import './SolutionPane.css';


interface SolutionPaneProps {
    solState: { startingBoard: number[], solution: number[], idx: number };
    solType: string;
    onStep: () => void;
    onStepBack: () => void;
    onSolve: () => void;
    onReset: () => void;
    onPlay: (speed: number) => void;
    onRev: (speed: number) => void;
    onPause: () => void;
    activePlayback: boolean;
    playbackType: string;
    playbackSpeed: number;
    solving: number;
}

const SolutionPane: React.FC<SolutionPaneProps> = ({
    solState,
    solType,
    onStep,
    onStepBack,
    onSolve,
    onReset,
    onPlay,
    onRev,
    onPause,
    activePlayback,
    playbackType,
    playbackSpeed,
    solving,
}) => { 
    const [solMoves, setSolMoves] = useState(0);
    const [canSolve, setCanSolve] = useState(!activePlayback && solving === 0);
    const [canPlay, setCanPlay] = useState(!activePlayback || playbackType === solType)
    const [solveText, setSolveText] = useState('Solve');
    const [activeSolver, setActiveSolver] = useState(false);
    let solveTextIntervalId = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setCanSolve(!activePlayback && solving === 0);
    }, [activePlayback, solving]);

    useEffect(() => {
        if (solving === ['', 'astar', 'idastar', 'precomp', 'reduction'].indexOf(solType)) {
            setActiveSolver(true);
        } else {
            setActiveSolver(false);
        }
    }, [solving])

    useEffect(() => {
        if (activeSolver) {
            let dots = 1;
            setSolveText('.');
            solveTextIntervalId.current = setInterval(() => {
                setSolveText('.'.repeat((dots % 3 ) + 1));
                dots ++;
            }, 800);
        } else {
            if (solveTextIntervalId.current !== null) {
                clearInterval(solveTextIntervalId.current);
            }
            setSolveText('Solve');
        }
    }, [activeSolver])

    useEffect(() => {
        setCanPlay((!activePlayback || playbackType === solType) && solving === 0);
    }, [activePlayback, playbackType, solving]);

    useEffect(() => {
        setSolMoves(solState.solution.length);
    }, [solState]);

    const playbackButtons = [
    { label: '⏮', onClick: onReset, ariaLabel: 'reset to start', className: 'reset-to-sol-start', condition: true, pressed: false },
    { label: '◀◀◀', onClick: () => onRev(2), ariaLabel: 'ultra fast reverse', className: 'uff-reverse-button', condition: canPlay, pressed: (playbackType === solType && playbackSpeed === -3) },
    { label: '◀◀', onClick: () => onRev(1), ariaLabel: 'fast reverse', className: 'ff-reverse-button', condition: canPlay, pressed: (playbackType === solType && playbackSpeed === -2) },
    { label: '◀', onClick: () => onRev(0), ariaLabel: 'play in reverse', className: 'reverse-button', condition: canPlay, pressed: (playbackType === solType && playbackSpeed === -1) },
    { label: '◁', onClick: onStepBack, ariaLabel: 'previous', className: 'step-back-button', condition: true, pressed: false },
    { label: '⏸', onClick: onPause, ariaLabel: 'pause', className: 'pause-button', condition: true, pressed: false },
    { label: '▷', onClick: onStep, ariaLabel: 'next', className: 'step-button', condition: true, pressed: false },
    { label: '▶', onClick: () => onPlay(0), ariaLabel: 'play', className: 'play-button', condition: canPlay, pressed: (playbackType === solType && playbackSpeed === 1) },
    { label: '▶▶', onClick: () => onPlay(1), ariaLabel: 'fast forward', className: 'ff-button', condition: canPlay, pressed: (playbackType === solType && playbackSpeed === 2) },
    { label: '▶▶▶', onClick: () => onPlay(2), ariaLabel: 'ultra fast forward', className: 'uff-button', condition: canPlay, pressed: (playbackType === solType && playbackSpeed === 3) },
    ];

    return (
        <div
          className="solution-pane"
        >
            <button
              className={`solve-button ${activeSolver ? 'active' : ''}`}
              onClick={onSolve}
              {...((!canSolve && !activeSolver) && {disabled: true})}
            >
                {solveText}
            </button>
            <div
              className="playback-buttons"
            >
                {playbackButtons.map((btn, i) => (
                    <button
                    key={i}
                    className={`${btn.className} ${btn.pressed ? 'active' : ''}`}
                    aria-label={btn.ariaLabel}
                    onClick={btn.onClick}
                    {...(!btn.condition && {disabled: true})}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>
            <span
              className="sol-move-count"
            >
                {solState.idx + 1}/{solMoves}
            </span>
        </div>
    )
}

export default React.memo(SolutionPane);