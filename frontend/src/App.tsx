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
            setBoard={board.setBoard}
            n={board.n}
            onTileClick={board.pushTile}
            isAnimating={board.solutions.playbackActive}
            draggable={board.draggable}
          />
          <div
            className="top-right"
          >
            <ControlPanel
              n={board.n}
              reset={board.reset}
              setN={board.adjustN}
              scramble={board.scrambleBoard}
              draggable={board.draggable}
              toggleDrag={board.toggleDrag}
              setBoard={board.fromBoard}
            />
            <div
              className="top-right-text"
            >
              <p className="instructions">
                <b>Above:</b> Configure the puzzle
              </p>
              <p className="instructions">
                <b>Below:</b> Track progress
              </p>
              <p className="instructions">
                <b>Bottom:</b> Use a solver
              </p>
              <p className="github-link">
                <a href="https://github.com/s-behrangi/sliding_puzzle">Source/Read More</a>
              </p>
            </div>
            <ProgressPanel
              isSolved={board.solved}
              isActive={board.isActive}
              moveCount={board.moveCount}
              distances={board.distances}
              setMoveCount={board.setMoveCount}
              setActive={board.setIsActive}
              solvable={board.solvable}
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