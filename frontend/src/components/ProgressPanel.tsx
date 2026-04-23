import React from 'react';
import Stopwatch from './Stopwatch';
import './ProgressPanel.css';

interface ProgressPanelProps {
    isSolved: boolean,
    isActive: boolean,
    moveCount: number,
    distances: number[],
}

const ProgressPanel: React.FC<ProgressPanelProps> = ({
    isSolved,
    isActive,
    moveCount,
    distances,
}) => {

    return (
        <div
          className="progress-panel"
        >
            <span
              className='is-solved-display'
            >
              {isSolved ? <b>Solved!</b> : "Unsolved"}
            </span>
             <div
              className='move-count-display'
            >
                <span>Moves:</span><span>{moveCount}</span>
            </div>
            <Stopwatch
              isSolved={isSolved}
              isActive={isActive}
            />
            <div
              className='distances-display'
            >
              <p className='distance-header'><b>DISTANCE</b></p>
              <div className='distance'><span>Hamming:</span> <span>{distances[0]}</span></div>
              <div className='distance'><span>Manhattan:</span> <span>{distances[1]}</span></div>
              <div className='distance'><span>Linear Conflict:</span> <span>{distances[2]}</span></div>
            </div>
           
        </div>
    )
};

export default React.memo(ProgressPanel);