import React, { useEffect } from 'react';
import  { useStopwatch } from '../hooks/useStopwatch.ts';
import './Stopwatch.css'

interface StopwatchProps {
    isSolved: boolean;
    isActive: boolean;
}

const Stopwatch: React.FC<StopwatchProps> = ({
    isSolved,
    isActive,
}) => {
    const timer = useStopwatch();

    useEffect(() => {
        if (isSolved) {
            if (isActive) {
                timer.pause();
            } else {
                timer.reset();
            }
        } else if (isActive) {
            timer.start();
        }
    }, [ isSolved, isActive])

    return (
        <div
        className="stopwatch"
        >
            <button
              className="timer-reset-button"
              onClick={timer.reset}
              aria-label="reset timer"
            >
              ■
            </button>
            <div className="time"><span>{timer.minutes.toString().padStart(2, '0')}</span>:<span>{timer.seconds.toString().padStart(2, '0')}</span>:<span>{timer.milliseconds.toString().padStart(2, '0')}</span></div>
            
            <button
              className="timer-pause-button"
              onClick={timer.pause}
              aria-label="pause timer"
            >
                ⏯
            </button>
        </div>

    )
};

export default React.memo(Stopwatch)