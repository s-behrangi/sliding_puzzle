import React, { useCallback } from 'react';
import SizeSlider from './SizeSlider';
import './ControlPanel.css';

interface ControlPanelProps {
    n: number,
    reset: () => void,
    setN: (n: number) => void,
    scramble: (style: number) => void,
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    n,
    reset,
    setN,
    scramble,
}) => {

    const handleScrambleClick = useCallback(() => {
        scramble(1);
    }, [n]);


    return (
        <div
          className="control-panel"
        >
            <div
              className="title"
            >
              <h1>
                {n}×{n} <br/> Sliding Puzzle
              </h1>
            </div>
            <SizeSlider
                n={n}
                setN={setN}
            />
            <div
              className='control-panel-button-col'
            >
              <button
                className='scramble-button'
                onClick={handleScrambleClick}
              >
                  Scramble
              </button>
              <button
                className='reset-button'
                onClick={reset}
              >
                  Reset
              </button>
            </div>
        </div>
    )
};

export default React.memo(ControlPanel);