# Sliding Puzzle w/ Solvers

This single-page application is both a game and a technical demonstration of several algorithms. The stack is a Rust backend packed with WebAssembly, and a TypeScript frontend using React.js (via Vite). [The built version is hosted on GitHub Pages](https://s-behrangi.github.io/sliding_puzzle/). 

## Game Functionality

- Size ranges from 2×2 to 12×12
- Scramble that uses a pseudo-random shuffle on the board while ensuring solvability (solvability is determined by parity, explained nicely [here](https://www.cs.princeton.edu/courses/archive/spring21/cos226/assignments/8puzzle/specification.php))
- Tracking of aforementioned solvability
- The ability to rearrange pieces or input a custom board
- Six colour themes
- Move counting, a timer, and tracking of distance to solution in three heuristics: Hamming, Manhattan Distance, and Manhattan Distance + Linear Conflict

## Four Solving Algorithms

### A*

Runs a breadth-first search on puzzle states, using a heuristic to determine the order in which nodes are visited. The strength of the heuristic decides the efficiency when the implementation is otherwise already given. I use Manhattan Distance + Linear Conflict here, because it is easily computable and can be updated cheaply upon board moves without total recomputation. There is also [Walking Distance](https://web.archive.org/web/20141224035932/http://juropollo.xe0.ru/stp_wd_translation_en.htm) which takes some further conflicts into account, but is more expensive to compute. 

The A* here is instantaneous (millisecond or less) on 3×3 or 2×2 puzzles. It's also good at giving solutions on *most* 4×4 boards in a few seconds or less, but it can choke on certain configurations. The implementation does not extend to 5×5, both because only the easiest states would be solvable in the first place, and because when the board is 4×4 or smaller, it can be neatly encoded as a 64-bit number. Because A* can have overwhelming space complexity, this helps keep RAM hogging down.

### IDA*

Stands for Iterative-Deepening A*. Iterates a depth-first search, imposing a threshold on the maximum heuristic value it will visit during each iteration. The threshold is raised until a solution, which is guaranteed to be optimal so long as the heuristic is admissible, is found. The heuristic here uses disjoint Pattern Databases (PDAs); PDAs were first proposed in *Pattern Databases* by Joseph C. Culberson and Jonathan Schaeffer (*Computational Intelligence*, 1998), but these were not disjoint, because they would count the blank tile repeatedly. The method was refined into *Disjoint Pattern Database Heuristics* by Richard E. Korf, Ariel Felner (*Artificial Intelligence*, 2002), and was the first algorithm to yield optimal solutions to the 5×5 in reasonable time. 

Disjoint PDAs divide the board into groupings of tiles and compute the cost of moving each group to a certain arrangement, while ignoring tiles outside of that group. For a given unsolved board, the positions of the tiles are matched to their respective pattern costs, and the costs are summed up to give a heuristic. Note that in the non-disjoint implementation, recounting of the blank tile meant that the heuristic could only use the largest single value rather than the sum, losing information. Regardless, the larger the groups are for each pattern, the more effective the heuristic is, since it will take more conflicts into account. However, PDAs have to be stored, and the size grows as the *factorial* of the size of the group. Suppose we break the 15-puzzle (4×4) into a 7/8 pattern, and consider the 8 pattern. There are 16 spots on the board, and 8 tiles to arrange amongst them. This corresponds to `16*15*14*13*12*11*10*9=518 918 400` configurations. Even using properties of symmetry to make certain configurations redundant, this would take hundreds of megabytes. PDAs for the 24-puzzle are even larger.

Because this is intended to be a fast-loading SPA, the PDA used here is a comparatively weaker 5/5/5 split of the board. Each group has `16*15*14*13*12=524 160` configurations. Since the cost of a given configuration is never greater than about fifty, each cost can be stored in a byte, and the database for the whole group comes out to half a megabyte. For three patterns of five, this is a much more manageable database of 1.5mB. It *does* take some work to serve the PDA this way: it has to be stored as an array of length 524160, where each index gives the cost of a certain configuration. But how do we set up a bijection between configurations and indices? We use a combination of [colexicographic ordering](https://en.wikipedia.org/wiki/Combinatorial_number_system) and [Lehmer codes](https://en.wikipedia.org/wiki/Lehmer_code) (permutation ordering). The colex order gives a unique number for each choice of five spots on the board, but does not distinguish between how tiles might be arranged betwen those five positions. Meanwhile, each ordering of five numbered tiles has one of 120 Lehmer codes when converted to an ordering of the set `(1,2,3,4,5)`. By "convert", I mean that for the purposes of permutation ordering, `(6, 7, 8, 9, 10)` and `(1, 2, 3, 4, 5)` are identical. Therefore, a unique index is given by the formula `colex * 120 + lehmer`. 

This implementation is better than A* by a factor of maybe three, but it still struggles on certain puzzles. 

### Precomputation

The 3×3 has only `181 440` solvable configurations, and the 2×2 has just `12`. This makes it trivial to precompute the shortest path to each configuration using a BFS and store the move that led to a given configuration in an array. The database is less than half a megabyte even if we don't bother optimizing away unsolvable states. Indices are encoded the same was as above. An optimal solution is given by walking back from a starting state to the solved state in more or less constant time: the only computation to be done is converting configurations into the corresponding indices and checking the precomputed array. This needs to be done just as many times as there are moves to the solution.

### Reduction

The only *non-optimal* algorithm here. Solves the puzzle one row and column at a time starting at the top-left. Each piece is moved where it belongs by manipulation of the blank space. A helper function uses a quick A* to figure out how to get the blank where it needs to go (this is much easier than having A* solve the whole board, since a Manhattan Distance heuristic is much stronger and there are far fewer configurations to viist). Once everything but the last 3×3 is solved, that corner is handed off to the precomputed tables. Note that because the order of tile values in a solved 3×3 corner is identical to the order in a 3×3 itself, this doesn't even require any adjustments of the algorithm.

## Some Links
\[[1](http://forum.cubeman.org/?q=node/view/555)\] A post on a forum dedicated to puzzles  
\[[2](http://forum.cubeman.org/?q=node/view/238)\] Another  
\[[3](https://arxiv.org/pdf/1107.0050)\] *Additive Pattern Database Heuristics* (ArXiv)  
\[[4](https://github.com/sourcedennis/puzzle24)\] `puzzle24`, a rust crate which implements IDA* for the 5×5 with numerous impressive optimizations
