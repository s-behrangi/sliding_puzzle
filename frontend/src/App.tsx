import { useBoard } from './hooks/useBoard.ts';
import './App.css'
import PuzzleBoard from './components/PuzzleBoard.tsx';
import ControlPanel from './components/ControlPanel.tsx'
import SolverPanel from './components/SolverPanel.tsx';
import ProgressPanel from './components/ProgressPanel.tsx';
import { ThemeProvider } from './ThemeContext.tsx';

/*
TODO:

Add auto-termination for a solution that takes too long?
Add ability to rearrange board
Add tooltips?

*/

function App() {
  const board = useBoard();

  return (
    <ThemeProvider>
      <div className="app">
        <div
          className="top-panel"
        >
          <PuzzleBoard 
            board={board.board}
            n={board.n}
            onTileClick={board.pushTile}
            isAnimating={board.solutions.playbackActive}
          />
          <div
            className="top-right"
          >
            <ControlPanel
              n={board.n}
              reset={board.reset}
              setN={board.setN}
              scramble={board.scrambleBoard}
            />
            <div
              className="top-right-text"
            >
              <p>
                <b>Above:</b> Configure the puzzle
              </p>
              <p>
                <b>Below:</b> Track progress
              </p>
              <p>
                <b>Bottom:</b> Use a solver
              </p>
            </div>
            <ProgressPanel
              isSolved={board.solved}
              isActive={board.isActive}
              moveCount={board.moveCount}
              distances={board.distances}
              setMoveCount={board.setMoveCount}
              setActive={board.setIsActive}
            />
          </div>
          
        </div>
        <SolverPanel
          solutions={board.solutions.solutions}
          onBack={board.solutions.stepSolBack}
          onStep={board.solutions.stepSol}
          onSolve={board.solve}
          onReset={board.solutions.reset}
          onPlay={board.solutions.playSol}
          onRev={board.solutions.revSol}
          onPause={board.solutions.pause}
          activePlayback={board.solutions.playbackActive}
          playbackType={board.solutions.playbackType}
          playbackSpeed={board.solutions.playbackSpeed}
          solving={board.solving}
        />
      </div>
    </ThemeProvider>
  )  
}

export default App