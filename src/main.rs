use lib::SlidingPuzzle;
use std::time::Instant;

fn main() {
    
    let mut puzzle = SlidingPuzzle::new(2);
    //let mut puzzle = SlidingPuzzle::from_flat(vec![8, 2, 7, 11, 14, 0, 3, 10, 4, 13, 1, 6, 12, 9, 15, 5]);
    println!("\nOriginal puzzle:\n");
    puzzle.print_grid();
    puzzle.scramble_shuffle();
    println!("Scrambled puzzle with Manhattan distance {}, {} with linear conflict, or {} with PDB heuristic: \n", puzzle.get_manhattan_dist(), puzzle.get_lin_conflict_dist(), puzzle.get_pdb());
    puzzle.print_grid();

    println!("Solving by reduction...");
    let start = Instant::now();
    let solution = puzzle.solve_reduction();
    let duration = start.elapsed();
    println!("Reduction yielded a {} move solution, in {duration:.2?}", solution.len());

    for &i in &solution {
        puzzle.make_move(i);
    }

    println!("State after solution:");
    puzzle.print_grid();
    

    /*
    let mut puzzle = SlidingPuzzle::new(4);
    //let mut puzzle = SlidingPuzzle::from_flat(vec![5, 4, 3, 2, 1, 10, 9, 8, 7, 6, 15, 14, 13, 12, 11, 0]);
    println!("\nOriginal puzzle:\n");
    puzzle.print_grid();
    puzzle.scramble_shuffle();
    println!("Scrambled puzzle with Manhattan distance {}, {} with linear conflict, or {} with PDB heuristic: \n", puzzle.get_manhattan_dist(), puzzle.get_lin_conflict_dist(), puzzle.get_pdb());
    puzzle.print_grid();

    println!("Solving with A*...");
    let start = Instant::now();
    let (solution, nodes) = puzzle.solve_astar();
    let duration = start.elapsed();
    print!("A* yielded the following optimal solution after searching {nodes} nodes, with {} moves, in {duration:.2?}: ", {solution.len()});
    for &i in &solution {
        match i {
            0 => print!("U"),
            1 => print!("D"),
            2 => print!("L"),
            _ => print!("R"), 
        }
    }

    println!("\n");

    println!("Solving with IDA*...");
    let start = Instant::now();
    let solution = puzzle.solve_idastar();
    let duration = start.elapsed();
    print!("IDA* yielded the following optimal solution, with {} moves, in {duration:.2?}: ", {solution.len()});
    for &i in &solution {
        match i {
            0 => print!("U"),
            1 => print!("D"),
            2 => print!("L"),
            _ => print!("R"), 
        }
    }

    println!("\n");

    println!("Solving by reduction...");
    let start = Instant::now();
    let solution = puzzle.solve_reduction();
    let duration = start.elapsed();
    println!("Reduction yielded a {} move solution, in {duration:.2?}", solution.len());

    println!();
    */
 }
