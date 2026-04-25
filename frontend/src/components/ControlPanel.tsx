import React, { useCallback, useState } from 'react';
import SizeSlider from './SizeSlider';
import ThemeRadio from './ThemeRadio';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import { verifyInputBoard, gobbleInputBoard } from '../utils/puzzleUtils';
import './ControlPanel.css';

interface ControlPanelProps {
    n: number,
    reset: () => void,
    setN: (n: number) => void,
    scramble: (style: number) => void,
    draggable: boolean,
    toggleDrag: () => void,
    setBoard: (board: number[]) => void,
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    n,
    reset,
    setN,
    scramble,
    draggable,
    toggleDrag,
    setBoard,
}) => {
    const [diagOpen, setDiagOpen] = useState(false);
    const handleScrambleClick = useCallback(() => {
        scramble(1);
    }, [n]);

    const handleDiagOpen = () => {
      setDiagOpen(true);
    }

    const handleDiagClose = () => {
      setDiagOpen(false);
    };

    const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const formJson = Object.fromEntries((formData as any).entries());
      const customBoard = formJson.board;
      if (verifyInputBoard(customBoard)) {
        setBoard(gobbleInputBoard(customBoard));
      }
      handleDiagClose();
    };

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
                <button
                  onClick={handleDiagOpen}
                  className={`custom-input-button ${diagOpen ? 'active' : ''}`}
                >
                  &#9998;
                </button>
              </div>
            </div>
            <ThemeRadio/>
            <Dialog 
              open={diagOpen} 
              onClose={handleDiagClose}
              slotProps={{
                paper: {
                  sx: {
                    backgroundColor:'var(--panel-bg)',
                    borderRadius: '0px',
                    borderStyle: 'ridge',
                    borderWidth: '10px',
                    borderColor: 'var(--panel-border)',
                  }

                }
              }}
            >
                <DialogContent
     
                >
                  <DialogContentText
                    sx = {{
                      fontFamily: "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif",
                      color: 'var(--panel-text)',
                      lineHeight: '1.2',
                      fontWeight: 800,
                      textAlign: 'justify',
                    }}
                  >
                    Enter space/comma separated values corresponding to a board. Size may range from 2×2 to 12×12. Note that valid inputs must have a square number (4, 9, 25...) of values, or else they do not represent a square board. 
                    <br/>
                    <br/>
                    Use 0 to indicate the blank.
                  </DialogContentText>
                  <form onSubmit={handleSubmit} id="board-form">
                    <input
                      className="board-input"
                      placeholder="e.g. 1 2 3 4 5 6 7 8 0 represents a solved 3×3"
                      type="text"
                      name="board"
                    >
                    </input>
                  </form>
                </DialogContent>
              <DialogActions
                sx = {{
                    backgroundColor:'var(--panel-bg)',
                
                  }}
              >
                <button onClick={handleDiagClose}>Cancel</button>
                <button type="submit" form="board-form">
                  Submit
                </button>
              </DialogActions>

            </Dialog>
        </div>
    )
};

export default React.memo(ControlPanel);