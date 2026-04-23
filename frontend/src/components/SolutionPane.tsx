import React, { useState, useEffect } from 'react';
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
}) => { 
    const [solMoves, setSolMoves] = useState(0);
    const [canSolve, setCanSolve] = useState(!activePlayback);
    const [canPlay, setCanPlay] = useState(!activePlayback || playbackType === solType)

    useEffect(() => {
        setCanSolve(!activePlayback);
    }, [activePlayback]);

    useEffect(() => {
        setCanPlay(!activePlayback || playbackType === solType);
    }, [activePlayback, playbackType]);

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
              className="solve-button"
              onClick={onSolve}
              {...(!canSolve && {disabled: true})}
            >
                Solve
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