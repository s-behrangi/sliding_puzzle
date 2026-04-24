import React, { useCallback } from 'react';
import SizeSlider from './SizeSlider';
import ThemeRadio from './ThemeRadio';
import './ControlPanel.css';

interface ControlPanelProps {
    n: number,
    reset: () => void,
    setN: (n: number) => void,
    scramble: (style: number) => void,
    draggable: boolean,
    toggleDrag: () => void,
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    n,
    reset,
    setN,
    scramble,
    draggable,
    toggleDrag,
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
              <div
                className='control-panel-button-row'
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
              <div
                className='control-panel-button-row'
              >
                <button
                  onClick={toggleDrag}
                  className={`rearrange-button ${draggable ? 'active' : ''}`}
                >
                  Rearrange
                </button>

              </div>
            </div>
            <ThemeRadio/>
        </div>
    )
};

export default React.memo(ControlPanel);