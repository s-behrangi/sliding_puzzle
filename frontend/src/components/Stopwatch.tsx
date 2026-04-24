import React, { useEffect } from 'react';
import  { useStopwatch } from '../hooks/useStopwatch.ts';
import './Stopwatch.css'

interface StopwatchProps {
    isSolved: boolean;
    isActive: boolean;
    setActive: (t: boolean) => void;
}

const Stopwatch: React.FC<StopwatchProps> = ({
    isSolved,
    isActive,
    setActive,
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

    const handleReset = () => {
        setActive(false);
        timer.reset();
    }

    const handlePause = () => {
        setActive(false);
        timer.pause();
    }

    return (
        <div
        className="stopwatch"
        >
            <button
              className="timer-reset-button"
              onClick={handleReset}
              aria-label="reset timer"
            >
              ■
            </button>
            <div className="time"><span>{timer.minutes.toString().padStart(2, '0')}</span>:<span>{timer.seconds.toString().padStart(2, '0')}</span>:<span>{timer.milliseconds.toString().padStart(2, '0')}</span></div>
            
            <button
              className="timer-pause-button"
              onClick={handlePause}
              aria-label="pause timer"
            >
                ⏯
            </button>
        </div>

    )
};

export default React.memo(Stopwatch)