import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import { useTheme } from '@mui/material/styles';
import SolutionPane from './SolutionPane.tsx';
import type { Solutions } from '../hooks/useSolution.ts';
import './SolverPanel.css';

const astarText = (
  <div className="solution-text">
    <p className="restriction-text">Restricted to <b>4×4</b> or smaller.</p>
    <p>Uses a <b>Breadth-First Search</b> to find an <b>optimal</b> solution to the puzzle. During the search, moves are tried out according to a <b>heuristic</b>, which is a rigorous guess at how close the board is to being solved. The choice of heuristic makes the biggest difference to how quickly a solution is found. The algorithm here uses the <b>Manhattan distance</b>, taking <b>linear conflicts</b> into account. </p>
    <p>Despite the strength of this heuristic, the A* algorithm is not capable of solving puzzles larger than a 4×4 in reasonable time. You may even find it struggling with certain 4×4 puzzles.</p>
  </div>
);

const idastarText = (
  <div className="solution-text">
    <p className="restriction-text">Restricted to <b>4×4</b>.</p>
    <p>The <b>Iterative Deepening Algorithm</b> uses a  <b>Depth-First Search</b> to yield an <b>optimal</b> solution. The * indicates that we are using a heuristic—a rigorous guess of how close the board is to being solved. This particular heuristic uses <b>Pattern Databases</b> (PDBs), which is the current state-of-the-art. A PDB breaks the board down into groups of tiles and pre-computes how many moves it would take to arrive at each possible configuration of each group.</p>
    <p>Unfortunately, PDBs take up space, imposing a different kind of limit on what can be solved. The algorithm here uses a 5/5/5 breakdown of the 4×4 puzzle, which is both efficient and compact (1.5mB). However, the most efficient breakdown would be a 7/8 breakdown, which would take about half a gigabyte. Therefore, while this algorithm generally outperforms A*, it may still struggle.</p>
  </div>
);

const precompText = (
  <div className="solution-text">
    <p className="restriction-text">Restricted to <b>2×2</b> or <b>3×3</b>.</p>
    <p> There are 9! = 362,880 ways to configure a 3×3 puzzle. However, due to a property called <b>parity</b>, only half of these states are reachable from the solution; thus, only half these states are themselves solvable. This means there are only 181,440 configurations we care about, while for the 2×2, there are only <code>4!/2 = 12</code> states.</p>
    
    <p>It is trivial for a computer to calculate the shortest path to each of these states, and storing the results takes just a couple hundred kilobytes. The precomputed moves can then be walked back (<b>optimally</b>) from any scrambled state to the solution almost instantaneously.</p>

    <p>What about the 4×4? There are <code>16!/2 = 10,461,394,944,000</code> solvable states. Infeasible to compute.</p>
  </div>
);

const reductionText = (
  <div className="solution-text">
    <p className="restriction-text">Unrestricted.</p>
    <p> Solves larger puzzles like a human might: one row and column at a time, moving individual pieces into place. This yields a <b>non-optimal</b> solution, but the complexity only grows as the square of side-length, rather than its factorial. This means that the reduction method can solve even large puzzles in a second.</p>
    <p>Note that in this implementation, the last 3×3 corner of the puzzle is handed off to the precomputed solutions. For larger puzzles, you can probably beat the solution this algorithm gives, though not the speed with which it gives it. Consider having it solve a large puzzle and playing the solution at the highest speed.</p>
  </div>
);

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, padding: 0}}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

interface SolverPanelProps {
  solutions: Solutions;
  onStep: (s: string) => void;
  onBack: (s: string) => void;
  onSolve: (s: string) => void;
  onReset: (s: string) => void;
  onPlay: (s: string, speed: number) => void;
  onRev: (s: string, speed: number) => void;
  onPause: () => void;
  activePlayback: boolean;
  playbackType: string;
  playbackSpeed: number;
  solving: number;
}

const SolverPanel: React.FC<SolverPanelProps> = ({
  solutions,
  onStep,
  onBack,
  onSolve,
  onReset,
  onPlay,
  onRev,
  onPause,
  activePlayback,
  playbackType,
  playbackSpeed,
  solving,
}) => {
    const theme = useTheme();
    const [selected, setSelected] = useState(0);

    const handleChange = (_: React.SyntheticEvent, newSelection: number) => {
        setSelected(newSelection);
    };

    const solutionTabs = [
      {label: 'A*', text: astarText, state: solutions.astar, sol: 'astar', className: 'astar-pane'},
      {label: 'IDA*', text: idastarText, state: solutions.idastar, sol: 'idastar', className: 'idastar-pane'},
      {label: 'precomp', text: precompText, state: solutions.precomp, sol: 'precomp', className: 'precomp-pane'},
      {label: 'Reduction', text: reductionText, state: solutions.reduction, sol: 'reduction', className: 'reduction-pane'}
    ];

    return (
        <Box className="solver-panel" sx={{ width: "100%" }}>
            <AppBar position="static" sx={{ height: '40px', boxShadow: 'none', backgroundColor: 'var(--button-bg)' }}>
                <Tabs
                value={selected}
                onChange={handleChange}
                textColor="inherit"
                variant="fullWidth"
                aria-label="solution options"
                >
                  {
                    solutionTabs.map((tab, i) => (
                      <Tab 
                        label={tab.label}
                        disableRipple
                        id={`full-width-tab-${i}`}
                        aria-controls={`full-width-tabpanel-${i}`}
                        sx={{
                          minHeight: '2px',
                          height: '40px',
                          color: 'var(--button-txt)',
                          borderStyle: 'outset',
                          borderColor: 'var(--button-border)',
                          borderWidth: '3px',
                          opacity: 1.0,
                          fontFamily: 'monospace',
                          fontSize: '18px',
                          fontWeight: '800',
                          '&:active': {
                            fontFamily: 'monospace', // Font changes while clicked
                            fontWeight: '800',
                          },
                          '&.Mui-selected': {
                            fontWeight: '800',
                            color: 'var(--button-txt)',
                            backgroundColor: 'var(--button-pressed)',
                            borderStyle: 'solid',
                            borderWidth: '3px',
                            borderTopColor: 'var(--button-inset-dark)',
                            borderLeftColor: 'var(--button-inset-dark)',
                            borderRightColor: 'var(--button-inset-light)',
                            borderBottomColor: 'var(--button-inset-light)',
                          }
                        }}
                      />
                    )
                  )}
                </Tabs>
            </AppBar>
            {solutionTabs.map((tab, i) => (
              <TabPanel value={selected} key={i} index={i} dir={theme.direction}>
                  {tab.text}
                <SolutionPane
                  solState={tab.state}
                  solType={tab.sol}
                  onStep={() => onStep(tab.sol)}
                  onStepBack={() => onBack(tab.sol)}
                  onSolve={() => onSolve(tab.sol)}
                  onReset={() => onReset(tab.sol)}
                  onPlay={(speed: number) => onPlay(tab.sol, speed)}
                  onRev={(speed: number) => onRev(tab.sol, speed)}
                  onPause={onPause}
                  activePlayback={activePlayback}
                  playbackType={playbackType}
                  playbackSpeed={playbackSpeed}
                  solving={solving}
                />
              </TabPanel>
            ))}
        </Box>
    );
};

export default React.memo(SolverPanel);