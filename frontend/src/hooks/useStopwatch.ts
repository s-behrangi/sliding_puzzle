import { useState, useCallback, useEffect } from 'react';

export function useStopwatch() {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning) {
            interval = setInterval(() => {
                setTime(prev => prev + 0.02);
            }, 20);
        } else if (interval) {
            clearInterval(interval);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning]);

    const start = useCallback(() => setIsRunning(true), []);
    const pause = useCallback(() => setIsRunning(prev => ! prev), []);
    const reset = useCallback(() => {
        setIsRunning(false);
        setTime(0);
    }, []);

    return {
        milliseconds: Math.floor((time % 1) * 100),
        seconds: Math.floor(time) % 60,
        minutes: Math.floor(time / 60) % 60,
        isRunning,
        start,
        pause,
        reset,
    };
}

