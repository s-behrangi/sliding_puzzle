use wasm_bindgen::prelude::wasm_bindgen;
use js_sys::Uint8Array;
use fastrand::{u8, shuffle};
use std::collections::BinaryHeap;
use std::cmp::Reverse;
use rustc_hash::{FxBuildHasher, FxHashMap};
use std::env;

const REVERSALS: [u8; 5] = [1, 0, 3, 2, 4]; // reversals[i] is the direction opposite i

static PDB_4X4_1THRU5: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/pdb_4x4_1thru5.bin"));
static PDB_4X4_6THRU10: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/pdb_4x4_6thru10.bin"));
static PDB_4X4_11THRU15: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/pdb_4x4_11thru15.bin"));

static PRECOMPUTED_3X3: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/full_3x3.bin"));
static PRECOMPUTED_2X2: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/full_2x2.bin"));

const FACT5: usize = 120;
const MAXN: usize = 25;
const MAXK: usize = 6;
const MAXFACT: usize = 10;

const fn binom(n: usize, k: usize) -> usize {
    if k > n { 0 }
    else if k == 0 { 1 }
    else { binom(n - 1, k - 1) + binom(n - 1, k) }
}

const BINOM_TABLE: [[usize; MAXK + 1]; MAXN] = {
    let mut table = [[0; MAXK + 1]; MAXN];
    let mut n = 0;
    while n < MAXN {
        let mut k = 0;
        while k <= MAXK {
            table[n][k] = binom(n, k);
            k += 1;
        }
        n += 1;
    }
    table
};

const FACT_TABLE: [usize; MAXFACT + 1] = {
    let mut fact = [1; MAXFACT + 1];
    let mut i = 1;
    while i <= MAXFACT {
        fact[i] = fact[i - 1] * i;
        i += 1;
    }
    fact
};

fn lehmer5(pos: [u8; 5]) -> usize {
    let mut sorted = pos.clone();
    sorted.sort_unstable();

    /* calculate combinadic contribution/colex position */
    let mut comb_rank = 0;
    for i in 0..5 {
        comb_rank += BINOM_TABLE[sorted[i] as usize][i + 1];
    }

    /* Lehmer */
    /* set up perm array */
    let mut perm = [0; 5];
    for i in 0..5 {
        for j in 0..5 {
            if pos[i] == sorted[j] {
                perm[i] = j;
                break;
            }
        }
    }

    let mut rem = [0; 5];
    for i in 0..5 {
        rem[i] = i;
    }
    let mut end = 5usize;

    let mut perm_rank = 0;
    for i in 0..5 {
        let mut j = 0;
        while j < end && rem[j] != perm[i] {
            j += 1;
        }

        perm_rank += j * FACT_TABLE[4 - i];

        while j + 1 < end {
            rem[j] = rem[j + 1];
            j += 1;
        }
        end -= 1;
    }

    comb_rank * FACT5 + perm_rank
}

fn lehmer_code(pos: &Vec<u8>) -> usize {
    /* more general method for lehmer code of permutations */
    let mut sorted = pos.clone();
    sorted.sort_unstable();

    let mut perm = vec![0; pos.len()];
    for i in 0..pos.len() {
        for j in 0..pos.len() {
            if pos[i] == sorted[j] {
                perm[i] = j;
            }
        }
    }

    let mut rem = (0..pos.len()).collect::<Vec<usize>>();
    let mut end = pos.len();
    let mut p_rank = 0;

    for i in 0..pos.len() {
        let mut j = 0;
        while j < end && rem[j] != perm[i] {
            j += 1;
        }

        p_rank += j * FACT_TABLE[pos.len() - 1 - i];

        while j + 1 < end {
            rem[j] = rem[j + 1];
            j += 1;
        }
        end -= 1;
    }
    
    p_rank
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct SlidingPuzzle {
    n: usize, //all sliding puzzles are n x n squares
    grid: Vec<u8>, //flattened representation of length n x n
    zero: usize, //location of zero/blank, so that we don't need to search for it each time
}

#[wasm_bindgen]
impl SlidingPuzzle {
    /* the implementation is such that it can serve as a fully functional puzzle
       within rust, while also being a lighter-weight backend for a frontend to 
       interface with. The heavy work of solves can be done on puzzles supplied
       as arrays without ever having to initialize a puzzle on the frontend      */  
    #[must_use]
    pub fn new(n: usize) -> Self {
        let mut grid: Vec<u8> = vec![0; n * n];
        for (i, x) in grid.iter_mut().enumerate().take(n * n - 1) {
            *x = (i + 1) as u8;
        }
        let zero = n * n - 1;
        Self {
            n,
            grid,
            zero,
        }
    }

    #[must_use]
    pub fn wasm_from(grid: &Uint8Array) -> Self {
        let grid = grid.to_vec();
        let n = grid.len().isqrt();
        assert!(grid.len() == n * n, "grid is of the wrong size");
        let index = grid.iter().position(|&x| x == 0);
        assert!(index.is_some(), "grid doesn't contain zero");
        let zero = index.unwrap();
        Self {
            n,
            grid,
            zero,
        }
    }

    #[must_use]
    pub fn is_solvable(&self) -> bool {
        /* use inversion count to determine parity of grid */
        let invs = self.count_inversions();
        let zerow = (self.zero / self.n) as u16;

        (self.n % 2 == 1 && invs % 2 == 0) ||
        (self.n % 2 == 0 && (invs + zerow) % 2 == 1)
    }

    pub fn scramble_walk(&mut self) {
        for _ in 0..self.n * self.n * 50 {
            let d = u8(0..4); //up, down, left, right (movement of ZERO)
            let z = self.zero;
            let swap = self.get_swap(d);
            self.grid[z] = self.grid[swap];
            self.grid[swap] = 0;
            self.zero = swap;
        }
    }

    pub fn scramble_shuffle(&mut self) {
        shuffle(&mut self.grid);
        self.zero = self.grid.iter().position(|&x| x == 0).unwrap();
        if ! self.is_solvable() {
            if self.zero > 1 {
                self.swap(0, 1);
            } else {
                self.swap(2, 3);
            }
        }
    }

    pub fn swap(&mut self, i: usize, j: usize) {
        /* swaps tiles, does *not* need to be a valid move (good for flipping parity) */
        let (n, m) = (self.grid[i], self.grid[j]);
        self.grid[i] = m;
        self.grid[j] = n;
        if self.grid[i] == 0 {
            self.zero = i;
        } else if self.grid[j] == 0 {
            self.zero = j;
        }
    }
    
    /* NOTE: All the "movement" methods refer to the direction BLANK/0 moves 
       ALSO -> moves are ignored if they are impossible. No error is thrown */
    pub fn up(&mut self) {
        let (z, n) = (self.zero, self.n);
        if z >= n {
            self.grid[z] = self.grid[z - n];
            self.grid[z - n] = 0;
            self.zero -= n;
        }
    }

    pub fn down(&mut self) {
        let (z, n) = (self.zero, self.n);
        if z < n * n - n {
            self.grid[z] = self.grid[z + n];
            self.grid[z + n] = 0;
            self.zero += n;
        }
    }

    pub fn left(&mut self) {
        let (z, n) = (self.zero, self.n);
        if z % n > 0 {
            self.grid[z] = self.grid[z - 1];
            self.grid[z - 1] = 0;
            self.zero -= 1;
        }
    }

    pub fn right(&mut self) {
        let (z, n) = (self.zero, self.n);
        if z % n < n - 1 {
            self.grid[z] = self.grid[z + 1];
            self.grid[z + 1] = 0;
            self.zero += 1;
        }
    }

    pub fn make_move(&mut self, i: u8) {
        //TODO: cleanup?
        if i == 0 && self.can_move(i) {
            self.up();
        } else if i == 1 && self.can_move(i) {
            self.down();
        } else if i == 2 && self.can_move(i) {
            self.left();
        } else if i == 3 && self.can_move(i) {
            self.right();
        }
    }

    pub fn can_move(&self, i: u8) -> bool {
        let (z, n) = (self.zero, self.n);
        match i {
            0 => z >= n,
            1 => z < n * n - n,
            2 => z % n > 0,
            _ => z % n < n - 1
        }
    }

    pub fn get_swap(&self, i: u8) -> usize {
        /* with i in [0, 1, 2, 3] = [up, down, left, right] 
           gives the index corresponding to the tile in that position
           relative to the blank tile. returns the blank tile if DNE */
        let (z, n) = (self.zero, self.n);
        match i {
                0 => { if z >= n { z - n }                          else { z } },
                1 => { if z < n * n - n { z + n}                    else { z } },
                2 => { if z % n > 0 { z - 1 }              else { z } },
                _ => { if z % n < n - 1 { z + 1 }  else { z } },
        }
    }

    pub fn manhattan_diff(&self, i: u8) -> i16 {
        /* with i in [0, 1, 2, 3] = [up, down, left, right] 
           returns diff to manhattan distance if the move is
           made. reduces O(N) full recalculation to O(1)     */
        let swap = self.get_swap(i);
        if swap == self.zero {
            return 0;
        }
        let val = self.grid[swap];
        let before = Self::manhattan_point(swap, val, self.n);
        let after = Self::manhattan_point(self.zero, val, self.n);
        (after as i16) - (before as i16)
    }

    pub fn get_lin_conflict_dist(&self) -> u16 {
        Self::lin_conflict_dist(&self.grid, self.n)
    }

    pub fn get_manhattan_dist(&self) -> u16 {
        Self::calc_manhattan(&self.grid, self.n)
    }

    pub fn get_pdb(&self) -> u8 {
        if self.n == 4 {
            Self::pdb_cost_5x5x5(Self::pack_64(&self.grid))
        } else {
            0
        }
    }



    pub fn wasm_get_grid(&self) -> Vec<u8> {
        self.grid.clone()
    }

    pub fn wasm_solve_astar(&self) -> Vec<u8> {
        self.solve_astar().0
    }

    pub fn wasm_solve_idastar(&self) -> Vec<u8> {
        self.solve_idastar()
    }

    pub fn wasm_solve_reduce(&self) -> Vec<u8> {
        self.solve_reduction()
    }

    pub fn wasm_solve_precomp(&self) -> Vec<u8> {
        Self::follow_precompute(self.grid.clone(), self.n)
    }

    pub fn wasm_solve_from(grid: &Uint8Array, method: u8) -> Vec<u8> {
        /* utility function so that we don't have to worry about state sync */
        let puzzle = Self::wasm_from(grid);
        match method {
            0 => puzzle.solve_astar().0,
            1 => puzzle.solve_idastar(),
            2 => puzzle.solve_reduction(),
            _ => Self::follow_precompute(puzzle.grid.clone(), puzzle.n)
        }
    }

    pub fn wasm_get_scrambled(n: usize, method: u8) -> Vec<u8> {
        let mut puzzle = Self::new(n);
        match method {
            0 => puzzle.scramble_shuffle(),
            _ => puzzle.scramble_walk(),
        }
        puzzle.grid.clone()
    }

    pub fn wasm_solvable_from(grid: &Uint8Array) -> bool {
        let puzzle = Self::wasm_from(grid);
        puzzle.is_solvable()
    }

    pub fn wasm_get_lin_conflict_distance(grid: &Uint8Array) -> u16 {
        let puzzle = Self::wasm_from(grid);
        puzzle.get_lin_conflict_dist()
    }    
}

impl SlidingPuzzle {
    #[must_use]
    pub fn from_square(grid: Vec<Vec<u8>>) -> Self {
        let (n, m) = (grid.len(), grid[0].len());
        assert!(n == m, "grid is not square");
        let grid = grid.into_iter().flatten().collect::<Vec<u8>>();
        let index = grid.iter().position(|&x| x == 0);
        assert!(index.is_some(), "grid doesn't contain zero");
        let zero = index.unwrap();
        Self {
            n,
            grid,
            zero,
        }
    }

    #[must_use]
    pub fn from_flat(grid: Vec<u8>) -> Self {
        let n = grid.len().isqrt();
        assert!(grid.len() == n * n, "grid is of the wrong size");
        let index = grid.iter().position(|&x| x == 0);
        assert!(index.is_some(), "grid doesn't contain zero");
        let zero = index.unwrap();
        Self {
            n,
            grid,
            zero,
        }
    }

    fn count_inversions(&self) -> u16 {
        let mut f_tree = FenwickTree::new(self.n * self.n - 1);
        let mut count = 0;

        for &val in &self.grid {
            if val != 0 {
                let leq = f_tree.query(val as usize);
                let grt = u16::from(val) - leq - 1;
                count += grt;
                f_tree.update(val as usize, 1);
            }
        }
        
        count
    }

    #[must_use]
    fn calc_manhattan(grid: &Vec<u8>, n: usize) -> u16 {
        let mut dist: u16 = 0;
        for (i, &val) in grid.iter().enumerate() {
            if val != 0 {
                dist += Self::manhattan_point(i, val, n);
            }
        }
        dist
    }

    #[must_use]
    fn manhattan_point(i: usize, val: u8, n: usize) -> u16 {
        /* gives the manhattan distance contribution from a single
           value at a particular index                             */
        let x = i % n;
        let y = i / n;
        let a = (val as usize - 1) % n;
        let b = (val as usize - 1) / n;
        (x.abs_diff(a) + y.abs_diff(b)) as u16
    }

    pub fn print_grid(&self) {
        for (i, &val) in self.grid.iter().enumerate() {
            if val == 0 {
                print!("{}", format!("{:>4}", "."));
            } else {
                print!("{}", format!("{:>4}", val));
            }
            
            if (i + 1) % self.n == 0 {
                println!();
            }
        }
        println!();
    }
    
    #[must_use]
    pub fn solve_reduction(&self) -> Vec<u8> {
        /* Non-optimal solve proceeding by successive reduction of rows and columns
           Consists of two phases: 
                1) Solve the top row and left column one time at a time
                2) When there is just a 3x2 unsolved region left, use precomputed table */
        
        let idx = |x: usize, y: usize| x * self.n + y;
        
        if self.n == 2 { return Self::follow_precompute(self.grid.clone(), 2); } //not currently supported

        /* we will be performing operations on this state, since we return a list of moves without solving */
        let mut state = self.grid.clone();
        let mut z = self.zero;
        let mut mask: Vec<bool> = vec![true; self.n * self.n];

        let mut solution: Vec<u8> = Vec::new();

        /* first stage: solve the first n - 3 rows columns */
        for m in 0..self.n - 3 {
            /* row stage */
            for col in m..self.n {
                let i = idx(m, col);    //index of target tile
                let val = (i + 1) as u8;        //expected value of target tile

                /* check if we even need to do anything */
                if state[i] == val { mask[i] = false; continue; }

                /* set up an intermediate target the row below i */
                let j = i + self.n;
                let mut cur = state.iter().position(|&x| x == val).unwrap(); //current location of target tile
                while cur != j {
                    /* note: consider taking advantage of existing zero position? */
                    /* arbitrary priority order: align horizontally before vertically */
                    /* k will be the index we want to move 0 to, dir is the next move after */
                    let (k, dir) = if cur % self.n < j % self.n { //to the left
                        (cur + 1, 2)
                    } else if cur % self.n > j % self.n { //to the right
                        (cur - 1, 3)
                    } else if cur / self.n > j / self.n { //below
                        (cur - self.n, 1)
                    } else if cur / self.n < j / self.n { //above (unlikely but possible)
                        (cur + self.n, 0)
                    } else { (z, 4) }; //shouldn't occur

                    if dir < 4 {
                        mask[cur] = false;
                        let (moves, new_state) = Self::move_zero(state.clone(), &mask, z, self.n, k);
                        mask[cur] = true;
                        cur = k; //because the tile is about to be moved where we put the zero
                        state = new_state;
                        /* move the target tile where the zero should now be */
                        z = Self::ext_make_move(&mut state, self.n, k, dir);
                        solution.extend(moves);
                        solution.push(dir);
                    }
                }
                /* now the target tile is in position to be moved up into the required row */
                /* behaviour differs depending on if this is the last tile of the row (harder) */
                if col < self.n - 1 {
                    /* in this case, simply move the 0 where we need it to be */
                    mask[j] = false;
                    let (moves, new_state) = Self::move_zero(state.clone(), &mask, z, self.n, i);
                    mask[j] = true;
                    state = new_state;
                    z = Self::ext_make_move(&mut state, self.n, i, 1);
                    solution.extend(moves);
                    solution.push(1);
                } else {
                    /* first check if the requisite tile by some coincidence happens to be empty */
                    if z == i {
                        z = Self::ext_make_move(&mut state, self.n, z, 1);
                        solution.push(1);
                    } else {
                        /* now we need to use a specific move sequence, starting by positioning the zero
                           immediately under the tile that we've moved into place                        */
                        mask[j] = false;
                        let (moves, new_state) = Self::move_zero(state.clone(), &mask, z, self.n, j + self.n);
                        mask[j] = true;
                        z = j + self.n;
                        state = new_state;
                        solution.extend(moves);
                        /* what follows is a set move sequence to get the tile in there */
                        for dir in [0, 0, 2, 1, 3, 1, 2, 0, 0, 3, 1] {
                            z = Self::ext_make_move(&mut state, self.n, z,  dir);
                            solution.push(dir);
                        }
                    }
                }
                mask[i] = false; //permanently mask the solved tile
            }
            /* col stage */
            /* this is just a transposition of the above (including the move sequence at the end) */
            for row in m + 1..self.n {
                let i = idx(row, m);
                let val = (i + 1) as u8;

                if state[i] == val { mask[i] = false; continue; }

                /* target is to the *right* of i */
                let j = i + 1;
                let mut cur = state.iter().position(|&x| x == val).unwrap();
                /* in the spirit of transposition, prioritize vertical alignment */
                while cur != j {
                    let (k, dir) = if cur / self.n < j / self.n { //above
                        (cur + self.n, 0)
                    } else if cur / self.n > j / self.n { //below
                        (cur - self.n, 1)
                    } else if cur % self.n < j % self.n { //to the left (unlikely)
                        (cur + 1, 2)
                    } else if cur % self.n > j % self.n { //to the right 
                        (cur - 1, 3)
                    } else { (z, 4) };
                    if dir < 4 {
                        mask[cur] = false;
                        let (moves, new_state) = Self::move_zero(state.clone(), &mask, z, self.n, k);
                        mask[cur] = true;
                        cur = k; //because the tile is about to be moved where we put the zero
                        state = new_state;
                        /* move the target tile where the zero should now be */
                        z = Self::ext_make_move(&mut state, self.n, k, dir);
                        solution.extend(moves);
                        solution.push(dir);
                    }
                }
                /* now tile is ready for insertion, again different behaviour depending on if it's the last or not */
                if row < self.n - 1 {
                    mask[j] = false;
                    let (moves, new_state) = Self::move_zero(state.clone(), &mask, z, self.n, i);
                    mask[j] = true;
                    state = new_state;
                    z = Self::ext_make_move(&mut state, self.n, i, 3);
                    solution.extend(moves);
                    solution.push(3);
                } else {
                    if z == i {
                        z = Self::ext_make_move(&mut state, self.n, z, 3);
                        solution.push(3);
                    } else {
                        /* transposition of above, zero goes to the *right* of positioned tile */
                        mask[j] = false;
                        let (moves, new_state) = Self::move_zero(state.clone(), &mask, z, self.n, j + 1);
                        mask[j] = true;
                        z = j + 1;
                        state = new_state;
                        solution.extend(moves);
                        for dir in [2, 2, 0, 3, 1, 3, 0, 2, 2, 1, 3] {
                            z = Self::ext_make_move(&mut state, self.n, z, dir);
                            solution.push(dir);
                        }
                    }
                }
                mask[i] = false; //permanently mask the solved tile
            }
        }

        let the_rest = Self::follow_precompute(Self::extract_3x3(&state, self.n), 3);
        solution.extend(the_rest);

        solution
    }

    #[must_use]
    fn extract_3x3(grid: & Vec<u8>, n: usize) -> Vec<u8> {
        /* grid must be 3x3 or larger
           returns the bottom-right 3x3 */
        vec![grid[n*(n - 3) + (n - 3)],   grid[n*(n - 3) + n - 2],  grid[n*(n - 3) + n - 1],
             grid[n*(n - 2) + (n - 3)],   grid[n*(n - 2) + n - 2],  grid[n*(n - 2) + n - 1],
             grid[n*(n - 1) + (n - 3)],   grid[n*(n - 1) + n - 2],  grid[n*(n - 1) + n - 1]]
    }

    fn follow_precompute(mut grid: Vec<u8>, n: usize) -> Vec<u8> {
        /*             <only usable for n = 2 or 3>  
           Takes advantage of the fact that lex ordering of permutations
           depends only on the relative ordering of the elements and not
           their absolute values, so that e.g. [5,4,3,2] and [3,2,1,0] 
           will be assigned the same lexicographic index by Lehmer codes */
        if n < 2 || n > 3 { return Vec::new(); }

        let mut solution: Vec<u8> = Vec::new();
        let mut z = grid.iter().position(|&x| x == 0).unwrap();
        let mut leh = lehmer_code(&grid);

        loop {
            let dir = if n == 2 {
                PRECOMPUTED_2X2[leh]
            } else {
                PRECOMPUTED_3X3[leh]
            };

            if dir == 4 { break; }

            solution.push(dir);
            z = Self::ext_make_move(&mut grid, n, z, dir);
            leh = lehmer_code(&grid);
        }

        solution
    }

    #[must_use]
    fn move_zero(grid: Vec<u8>, mask: &Vec<bool>, z: usize, n: usize, i: usize) -> (Vec<u8>, Vec<u8>) {
        /* returns a tuples where the first element is the moves required to get zero to i
           and the second is the state of the grid after that movement. specifically avoids
           moving tiles that are marked as false in the mask
           
           alg: runs an A* with manhattan distance b/w current zero and target zero         
           considering the connectedness of the space this should usually terminate after ~2n nodes max */

        let (g_row, g_col) = (i / n, i % n);
        let (row, col) = (z / n, z % n);
        let dist = (row.abs_diff(g_row) + col.abs_diff(g_col)) as u8;

        if dist == 0 { return (Vec::new(), grid); }

        /* structure:       grid     z      parent prev g  h */
        let mut nodes: Vec<(Vec<u8>, usize, usize, u8, u8, u8)> = Vec::new();
        let mut heap: BinaryHeap<Reverse<(u8, usize)>> = BinaryHeap::new();
        let mut visited: FxHashMap<Vec<u8>, u8> = FxHashMap::with_capacity_and_hasher(50, FxBuildHasher::default());

        nodes.push((grid.clone(), z, usize::MAX, 4, 0, dist));
        heap.push(Reverse((dist, 0)));
        visited.insert(grid, 0);

        while let Some(current) = heap.pop() {
            let mut i = current.0.1;
            let node = &nodes[i];
            let (grid, z, _, g, _) = (&node.0, node.1, node.3, node.4, node.5);

            if let Some(&visit) = visited.get(grid) && visit < g { continue; }

            let mut new_nodes: Vec<(Vec<u8>, usize, usize, u8, u8, u8)> = Vec::new();

            for dir in 0..4 {
                if dir != REVERSALS[dir as usize] && Self::ext_can_move(n, z, dir) {
                    let mut next = grid.clone();
                    let swap = Self::ext_get_swap(n, z, dir);

                    if ! mask[swap] { continue; }

                    next[z] = next[swap];
                    next[swap] = 0;

                    let new_g = g + 1;
                    let (row, col) = (swap / n, swap % n);
                    let new_h = (row.abs_diff(g_row) + col.abs_diff(g_col)) as u8;
                    
                    if new_h == 0 {
                        let mut solution: Vec<u8> = Vec::new();
                        solution.push(dir);
                        while i != 0 {
                            solution.push(nodes[i].3);
                            i = nodes[i].2;
                        }
                        let solution = solution.into_iter().rev().collect::<Vec<u8>>();
                        return (solution, next);
                    }

                    if let Some(&visit) = visited.get(&next) && visit <= new_g { continue; }
                    *visited.entry(next.clone()).or_insert(0) = new_g;

                    let new_f = new_g + new_h;
                    new_nodes.push((next, swap, i, dir, new_g, new_h));
                    heap.push(Reverse((new_f, nodes.len() + new_nodes.len() - 1)));
                }
            }
            nodes.extend(new_nodes);
        }
        println!("uh oh");
        
        (Vec::new(), Vec::new()) //should never happen
    }

    #[must_use]
    pub fn solve_astar(&self) -> (Vec<u8>, i32) {
        /* A* algorithm using Manhattan + linear conflict heuristic 
           Restricted to n < 5, both because it is infeasible on 5x5 
           and to allow packing of the grid in a u64 to reduce overhead */

        if self.get_manhattan_dist() == 0 || self.n > 4 {
            return (Vec::new(), 0);
        }
        
        let mut nodes: Vec<(u64, usize, usize, u8, u16, u16)> = Vec::with_capacity(2_000_000); //grid, zero, parent, prev_move, h, g
        let mut heap: BinaryHeap<Reverse<(u16, usize)>> = BinaryHeap::new();
        let mut visited: FxHashMap<u64, u16> = FxHashMap::with_capacity_and_hasher(2_000_000, FxBuildHasher::default());
        let packed = Self::pack_64(&self.grid);

        nodes.push((packed, self.zero, usize::MAX, 4, self.get_lin_conflict_dist(), 0));
        heap.push(Reverse((self.get_lin_conflict_dist(), 0)));
        visited.insert(packed, 0);

        let mut count = 0; //tracker of nodes visited, for interest

        while let Some(current) = heap.pop() {
            let mut i = current.0.1;
            let node = &nodes[i];
            let (grid, zero, _, prev_move, h, g) = (node.0, node.1, node.2, node.3, node.4, node.5);
            if let Some(&visit) = visited.get(&grid) && visit < g { continue }
            count += 1;
            for dir in 0..4 {
                /* check if the direction is *not* an immediate backtrack + the grid can actually be moved in that way */
                if (prev_move == 4 || dir != REVERSALS[prev_move as usize]) && Self::ext_can_move(self.n, zero, dir) {
                    let mut next = grid;
                    let (new_zero, diff) = Self::move_with_lin_diff_64(&mut next, self.n, zero, dir);
                    let new_h = ((h as i16) + diff) as u16;
                    let new_g = g + 1;

                    /* if this is a solved state, it must be an optimal one, so return solution */
                    if new_h == 0 {
                        let mut solution: Vec<u8> = Vec::new();
                        solution.push(dir);
                        while i != 0 {
                            solution.push(nodes[i].3);
                            i = nodes[i].2;
                        }
                        return (solution.into_iter().rev().collect::<Vec<u8>>(), count);
                    }

                    /* check if visited before adding */
                    if let Some(&visit) = visited.get(&next) && visit <= new_g { continue }
                    *visited.entry(next).or_insert(0) = new_g;

                    /* add this node to the vector and heap */
                    nodes.push((next, new_zero, i, dir, new_h, new_g));
                    heap.push(Reverse((new_h + new_g, nodes.len() - 1)));
                }
            }
        }
        (Vec::new(), 0) //should not be reached for a solvable puzzle
    }

    #[must_use]
    pub fn solve_idastar(&self) -> Vec<u8> {
        if self.n == 4 {
            self.solve_idastar_4x4()
        } else {
            Vec::new()
        }
    }

    #[must_use]
    fn solve_idastar_4x4(&self) -> Vec<u8> {
        /* optimization ideas: mostly think about precomputing lehmer code tables where possible
           or e.g. only one of three patterns changes each time, so only recompute the code for this pattern? */
        let mut solution: Vec<u8> = Vec::with_capacity(80);
        let mut visited: Vec<u64> = Vec::with_capacity(80);

        let start = Self::pack_64(&self.grid);
        let pos = Self::extract_5x5x5pat(start);
        let mut threshold = Self::pdb_cost_5x5x5(start);

        if threshold == 0 {
            return solution;
        }

        /* if true, solution has even moves, else odd */
        let parity = Self::checkerboard_parity(self.n, self.zero) == Self::checkerboard_parity(self.n, self.n * self.n - 1);
        if (parity && ! threshold.is_multiple_of(2)) || (! parity && threshold.is_multiple_of(2)) {
            threshold += 1;
        }

        visited.push(start);
        

        loop {
            let (solved, new_threshold) = Self::dfs_4x4(start, pos, self.zero, &mut solution, &mut visited, 4, threshold, 0);
            
            threshold = new_threshold;
            if (parity && ! threshold.is_multiple_of(2)) || (! parity && threshold.is_multiple_of(2)) {
                threshold += 1;
            }

            if solved {
                break;
            }
        }

        solution
    }

    #[must_use]
    fn dfs_4x4(packed: u64, pos: [[u8; 5]; 3], z: usize, solution: &mut Vec<u8>, visited: &mut Vec<u64>, prev: u8, threshold: u8, g: u8) -> (bool, u8) {
        let mut min_f = u8::MAX;
        let new_g = g + 1;
        for dir in 0..4 {
            if dir != REVERSALS[prev as usize] && Self::ext_can_move(4, z, dir) {
                
                let mut next = packed;
                let new_z = Self::move_64(&mut next, z, 4, dir);

                if visited.contains(&next) {
                    continue;
                }

                let mut new_pos = pos;
                let swap_val = Self::read_64(next, z);
                new_pos[((swap_val - 1) / 5) as usize][((swap_val - 1) % 5) as usize] = z as u8;
                let lehmer1 = lehmer5(new_pos[0]);
                let lehmer2 = lehmer5(new_pos[1]);
                let lehmer3 = lehmer5(new_pos[2]);
                let new_h = PDB_4X4_1THRU5[lehmer1] + PDB_4X4_6THRU10[lehmer2] + PDB_4X4_11THRU15[lehmer3];

                if new_h == 0 {
                    solution.push(dir);
                    return (true, 0);
                }

                let new_f = new_g + new_h;

                if new_f > threshold {
                    min_f = min_f.min(new_f);
                    continue;
                }

                

                solution.push(dir);
                visited.push(next);

                let (solved, next_min) = Self::dfs_4x4(next, new_pos, new_z, solution, visited, dir, threshold, new_g);

                if solved {
                    return (true, 0);
                }

                solution.pop();
                visited.pop();

                min_f = min_f.min(next_min);
            }
        }
        (false, min_f)
    }

    #[must_use]
    fn extract_5x5x5pat(packed: u64) -> [[u8; 5]; 3] {
        /* yields an array of three arrays, one for each pattern */
        let mut pos = [[0; 5]; 3];
        for i in 0..16 {
            let val = Self::read_64(packed, i) as usize;
            if val == 0 { continue }
            pos[(val - 1) / 5][(val - 1) % 5] = i as u8;
        }
        pos
    }

    #[must_use]
    fn pdb_cost_5x5x5(packed: u64) -> u8 {
        let positions = Self::extract_5x5x5pat(packed);

        let lehmer1 = lehmer5(positions[0]);
        let lehmer2 = lehmer5(positions[1]);
        let lehmer3 = lehmer5(positions[2]);
        
        PDB_4X4_1THRU5[lehmer1] + PDB_4X4_6THRU10[lehmer2] + PDB_4X4_11THRU15[lehmer3]
    }

    #[must_use]
    fn checkerboard_parity(n: usize, i: usize) -> bool {
        /* self consistent checkboard colouring of puzzle */
        let (row, col) = (i / n, n % n);
        let start_of_row= row.is_multiple_of(2);
        let matches = col.is_multiple_of(2);
        start_of_row ^ matches
    }

    #[must_use]
    fn ext_make_move(grid: &mut Vec<u8>, n: usize, z: usize, dir: u8) -> usize {
        //returns new zero
        if Self::ext_can_move(n, z, dir) {
            let swap = Self::ext_get_swap(n, z, dir);
            grid[z] = grid[swap];
            grid[swap] = 0;
            return swap;
        }
        z
    }

    #[must_use]
    fn ext_can_move(n: usize, z: usize, dir: u8) -> bool {
        match dir {
            0 => z >= n,
            1 => z < n * n - n,
            2 => z % n > 0,
            _ => z % n < n - 1
        }
    }

    #[must_use]
    fn ext_get_swap(n: usize, z: usize, dir: u8) -> usize {
        /* invalid moves returns z */
        match dir {
                0 => { if z >= n { z - n }          else { z } },
                1 => { if z < n * n - n { z + n}    else { z } },
                2 => { if z % n > 0 { z - 1 }       else { z } },
                _ => { if z % n < n - 1 { z + 1 }   else { z } },
        }
    }

    #[must_use]
    pub fn lin_conflict_dist(grid: &Vec<u8>, n: usize) -> u16 {
        let mut dist: u16 = 0;
        for (i, &val) in grid.iter().enumerate() {
            if val == 0 { continue; }
            let row = i / n;
            let col = i % n;
            let e_row = ((val as usize) - 1) / n;
            let e_col = ((val as usize) - 1) % n;

            /* manhattan contribution */
            let mdist = (row.abs_diff(e_row) + col.abs_diff(e_col)) as u16;
            dist += mdist;

            /* possibility of linear conflict on row 
               both loops only check *past* current element to avoid recounting */
            if row == e_row {
                let row_end = row * n + n;
                for (j, &other) in grid[i + 1..row_end].iter().enumerate() {
                    if other == 0 { continue; }
                    let oe_row = ((other as usize) - 1) / n;
                    let o_col = (i + j + 1) % n;
                    let oe_col = ((other as usize) - 1) % n;
                    if oe_row == row && ((o_col > col && oe_col < e_col) || (o_col < col && oe_col > e_col)) {
                        dist += 2;
                    }
                }
            }

            /* or column */
            if col == e_col {
                let mut j = i + n;
                while j < n * n {
                    let other = grid[j] as usize;
                    if other == 0 { j += n; continue; }
                    let oe_col = (other - 1) % n;
                    let o_row = j / n;
                    let oe_row = (other - 1) / n;
                    if oe_col == col && ((o_row > row && oe_row < e_row) || (o_row < row && oe_row > e_row)) {
                        dist += 2;
                    }
                    j += n;
                }
            }
        }
       dist
    }

    #[must_use]
    pub fn move_with_lin_diff_64(grid: &mut u64, n: usize, z: usize, dir: u8) -> (usize, i16) {
        /* makes a move in a packed grid and returns 
           (new_zero, linear conflict difference)    */

        let swap = Self::ext_get_swap(n, z, dir) as usize;
        let before = Self::lin_conflict_point_64(*grid, n, swap) as i16;
        Self::move_64(grid, z, n, dir);
        let after = Self::lin_conflict_point_64(*grid, n, z) as i16;
                
        (swap, after - before)
    }

    fn lin_conflict_point_64(grid: u64, n: usize, i: usize) -> u16 {
        /* Manhattan + linear conflict contribution of a single tile */
        let el = |i| Self::read_64(grid, i) as usize;
        let val = el(i);
        let (row, col) = (i / n, i % n);
        let (e_row, e_col) = ((val - 1) / n, (val - 1) % n);

        let mut dist = (row.abs_diff(e_row) + col.abs_diff(e_col)) as u16;

        if row == e_row {
            let (row_start, row_end) = (row * n, row * n + n);
            for j in row_start..row_end {
                let other = el(j);
                if j == i || other == 0 {
                    continue;
                }
                let oe_row = (other - 1) / n;
                let (o_col, oe_col) = (j % n, (other - 1) % n);
                if oe_row == row && ((o_col > col && oe_col < e_col) || (o_col < col && oe_col > e_col)) {
                    dist += 2;
                }
            }
        }

        if col == e_col {
            let mut j = col;
            while j < n * n {
                let other = el(j);
                if j == i || other == 0 {
                    j += n;
                    continue;
                }
                let oe_col = (other - 1) % n;
                let (o_row, oe_row) = (j / n, (other - 1) / n);
                if oe_col == col && ((o_row > row && oe_row < e_row) || (o_row < row && oe_row > e_row)) {
                    dist += 2;
                }
                j += n;
            }
        }
        dist
    }
    
    fn pack_64(grid: &[u8]) -> u64 {
        /* appropriate for packing 4x4 or smaller 
           packs such that first index is at LSB */
        let mut packed = 0u64;
        for &tile in grid.iter().rev() {
            packed = (packed << 4) | (tile as u64);
        }
        packed
    }

    fn move_64(grid: &mut u64, z: usize, n: usize, dir: u8) -> usize {
        /* performs the appropriate swap within the packed u64 */
        let swap = Self::ext_get_swap(n, z, dir);
        let val = Self::read_64(*grid, swap);
        /* first we set the zero spot, taking advantage of the fact that it's already zero */
        *grid |= (val as u64) << (z * 4);
        /* then we zero the swap spot */
        *grid &= !(0xF << (swap * 4));

        swap
    }

    fn read_64(grid: u64, i: usize) -> u8 {
        /* reads packed u64 for the given index */
        let offset = i * 4;
        ((grid >> offset) & 0xF) as u8
    }

    fn _unpack_64(grid: u64, n: usize) -> Vec<u8> {
        let mut unpacked: Vec<u8> = Vec::new();
        for i in 0..n*n {
            unpacked.push(((grid >> i * 4) & 0xF) as u8);
        }
        unpacked
    }

    #[must_use]
    pub fn get_grid(&self) -> &Vec<u8> {
        &self.grid
    }
}

struct FenwickTree {
    n: usize,
    tree: Vec<u16>,
}

impl FenwickTree {
    fn new(n: usize) -> Self {
        Self {
            n,
            tree: vec![0; n + 1],
        }
    }

    fn update(&mut self, mut i: usize, d: u16) {
        while i <= self.n {
            self.tree[i] += d;
            i += i & i.wrapping_neg();
        }
    }

    fn query(&self, mut i: usize) -> u16 {
        let mut sum = 0;
        while i > 0 {
            sum += self.tree[i];
            i -= i & i.wrapping_neg();
        }
        sum
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_solvables() {
        for n in 2..7 {
            let mut puzzle = SlidingPuzzle::new(n);
            for _ in 0..100 {
                puzzle.scramble_walk();
                assert!(puzzle.is_solvable());
            }
        }
    }

    #[test]
    fn test_unsolvables() {
        for n in 2..7 {
            for _ in 0..100 {
                let mut puzzle = SlidingPuzzle::new(n);
                puzzle.scramble_walk();
                if puzzle.zero > 1 {
                    puzzle.swap(0, 1);
                } else {
                    puzzle.swap(2, 3);
                }
                
                assert!(! puzzle.is_solvable());
            }
        }
    }
}