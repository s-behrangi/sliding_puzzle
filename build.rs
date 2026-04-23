use std::env;
use std::fs::File;
use std::io::Write;
use std::path::Path;
use std::collections::VecDeque;
use rustc_hash::{FxBuildHasher, FxHashMap};

const FACT5: usize = 120;
const N: usize = 25;
const K: usize = 5;

const fn binom(n: usize, k: usize) -> usize {
    if k > n { 0 }
    else if k == 0 { 1 }
    else { binom(n - 1, k - 1) + binom(n - 1, k) }
}

const BINOM_TABLE: [[usize; K + 1]; N] = {
    let mut table = [[0; K + 1]; N];
    let mut n = 0;
    while n < N {
        let mut k = 0;
        while k <= K {
            table[n][k] = binom(n, k);
            k += 1;
        }
        n += 1;
    }
    table
};

const FACT_TABLE: [usize; 10] = {
    let mut fact = [1; 10];
    let mut i = 1;
    while i <= 9 {
        fact[i] = fact[i - 1] * i;
        i += 1;
    }
    fact
};

const fn lehmer(pos: [u8; K]) -> usize {
    let mut sorted = pos;
    /* insertion sort on pos */
    let mut i = 0;
    while i < K {
        let mut j = i;
        while j > 0 && sorted[j - 1] > sorted[j] {
            let temp = sorted[j - 1];
            sorted[j - 1] = sorted[j];
            sorted[j] = temp;
            j -= 1;
        }
        i += 1;
    }

    /* calculate combinadic contribution */
    let mut comb_rank = 0;
    let mut i = 0 ;
    while i < K {
        comb_rank += BINOM_TABLE[sorted[i] as usize][i + 1];
        i += 1;
    }

    /* LEHMER */
    /* step one: generate perm as array of tiles according to their sorted position 
       e.g. if the tiles had positions [3, 5, 0, 12, 1] -> sorted is [0, 1, 3, 5, 12] 
       yielding perm [2, 3, 0, 4, 1]                                                 */
    let mut perm = [0; K];
    let mut i = 0;
    while i < K {
        let mut j = 0;
        while j < K {
            if pos[i] == sorted[j] {
                perm[i] = j;
                break;
            }
            j += 1;
        }
        i += 1;
    }

    /* step two: generate remaining values as [0, 1, 2, 3, 4] */
    let mut rem = [0; K];
    let mut i = 0;
    while i < K {
        rem[i] = i;
        i += 1;
    }
    let mut end = K; //the remaining remainders (gradually decremented)

    /* step three: compute the actual lehmer index going thru perm */
    let mut perm_rank = 0;
    let mut i = 0;
    while i < K {
        let mut j = 0;
        while j < end && rem[j] != perm[i] {
            j += 1;
        }

        perm_rank += j * FACT_TABLE[K - 1 - i];

        while j + 1 < end {
            rem[j] = rem[j + 1];
            j += 1;
        }
        end -= 1;
        i += 1;
    }

    comb_rank * FACT5 + perm_rank
}

const fn lehmer9(pos: [u8; 9]) -> usize {
    /* to provide lexicographic indexing of the 8-puzzle */
    let mut sorted = pos;
    /* insertion sort on pos */
    let mut i = 0;
    while i < 9 {
        let mut j = i;
        while j > 0 && sorted[j - 1] > sorted[j] {
            let temp = sorted[j - 1];
            sorted[j - 1] = sorted[j];
            sorted[j] = temp;
            j -= 1;
        }
        i += 1;
    }

    let mut perm = [0; 9];
    let mut i = 0;
    while i < 9 {
        let mut j = 0;
        while j < 9 {
            if pos[i] == sorted[j] {
                perm[i] = j;
                break;
            }
            j += 1;
        }
        i += 1;
    }

    let mut rem = [0; 9];
    let mut i = 0;
    while i < 9 {
        rem[i] = i;
        i += 1;
    }
    let mut end = 9;

    let mut perm_rank = 0;
    let mut i = 0;
    while i < 9 {
        let mut j = 0;
        while j < end && rem[j] != perm[i] {
            j += 1;
        }

        perm_rank += j * FACT_TABLE[9 - 1 - i];

        while j + 1 < end {
            rem[j] = rem[j + 1];
            j += 1;
        }
        end -= 1;
        i += 1;
    }

    perm_rank
}

const fn lehmer4(pos: [u8; 4]) -> usize {
    /* to provide lexicographic indexing of the 3-puzzle */
    let mut sorted = pos;
    /* insertion sort on pos */
    let mut i = 0;
    while i < 4 {
        let mut j = i;
        while j > 0 && sorted[j - 1] > sorted[j] {
            let temp = sorted[j - 1];
            sorted[j - 1] = sorted[j];
            sorted[j] = temp;
            j -= 1;
        }
        i += 1;
    }

    let mut perm = [0; 4];
    let mut i = 0;
    while i < 4 {
        let mut j = 0;
        while j < 4 {
            if pos[i] == sorted[j] {
                perm[i] = j;
                break;
            }
            j += 1;
        }
        i += 1;
    }

    let mut rem = [0; 4];
    let mut i = 0;
    while i < 4 {
        rem[i] = i;
        i += 1;
    }
    let mut end = 4;

    let mut perm_rank = 0;
    let mut i = 0;
    while i < 4 {
        let mut j = 0;
        while j < end && rem[j] != perm[i] {
            j += 1;
        }

        perm_rank += j * FACT_TABLE[4 - 1 - i];

        while j + 1 < end {
            rem[j] = rem[j + 1];
            j += 1;
        }
        end -= 1;
        i += 1;
    }

    perm_rank
}


fn main() {
    let pdb_4x4_1thru5 = encode_5pattern_4x4(compute_5pattern_4x4([1, 2, 3, 4, 5]));
    let pdb_4x4_6thru10 = encode_5pattern_4x4(compute_5pattern_4x4([6, 7, 8, 9, 10]));
    let pdb_4x4_11thru15 = encode_5pattern_4x4(compute_5pattern_4x4([11, 12, 13, 14, 15]));

    let full_3x3 = encode_3x3(compute_paths(3));
    let full_2x2 = encode_2x2(compute_paths(2));

    let out_dir = env::var_os("OUT_DIR").unwrap();
    println!("cargo:warning=Writing to: {}", out_dir.clone().into_string().unwrap());

    let dest_path = Path::new(&out_dir).join("pdb_4x4_1thru5.bin");
    let mut f = File::create(&dest_path).unwrap();
    f.write_all(&pdb_4x4_1thru5).unwrap();

    let dest_path = Path::new(&out_dir).join("pdb_4x4_6thru10.bin");
    let mut f = File::create(&dest_path).unwrap();
    f.write_all(&pdb_4x4_6thru10).unwrap();

    let dest_path = Path::new(&out_dir).join("pdb_4x4_11thru15.bin");
    let mut f = File::create(&dest_path).unwrap();
    f.write_all(&pdb_4x4_11thru15).unwrap();

    let dest_path = Path::new(&out_dir).join("full_3x3.bin");
    let mut f = File::create(&dest_path).unwrap();
    f.write_all(&full_3x3).unwrap();

    let dest_path = Path::new(&out_dir).join("full_2x2.bin");
    let mut f = File::create(&dest_path).unwrap();
    f.write_all(&full_2x2).unwrap();

    println!("cargo::rerun-if-changed=build.rs");
}

fn encode_5pattern_4x4(map: FxHashMap<u32, u8>) -> Vec<u8> {
    let mut encoding = vec![0u8; 524_160];
    for (key, val) in map {
        let unpacked = unpack_5pattern(key);
        let i = lehmer(unpacked);
        encoding[i] = val;
    }
    encoding
}

fn compute_5pattern_4x4(tiles: [u8; 5]) -> FxHashMap<u32, u8> {
    let start = [tiles[0] - 1, tiles[1] - 1, tiles[2] - 1, tiles[3] - 1, tiles[4] - 1];
    let mut queue: VecDeque<([u8; 5], u8)> = VecDeque::new();
    let mut visited: FxHashMap<u32, u8> = FxHashMap::with_capacity_and_hasher(524_160, FxBuildHasher::default());
    visited.insert(pack_5pattern(&start), 0);
    queue.push_back((start, 0));

    while let Some((pat, cost)) = queue.pop_front() {
        /* prune nodes previously visited at lower cost */
        if let Some(&visit) = visited.get(&pack_5pattern(&pat)) {
            if visit < cost {
                continue;
            }
        }

        for (i, &pos) in pat.iter().enumerate() {
            /* check each direction */
            for dir in 0..4 {
                if can_move(pos, 4, dir) {
                    let new_pos = move_pos(pos, 4, dir);
                    let mut occupied = false;
                    for j in 0..5 {
                        if j != i && pat[j] == new_pos {
                            occupied = true;
                            break;
                        }
                    }
                    if occupied {
                        continue;
                    }
                    let mut next = pat;
                    next[i] = new_pos;
                    let packed = pack_5pattern(&next);
                    let new_cost = cost + 1;
                    
                    if let Some(&visit) = visited.get(&packed) {
                        if visit <= new_cost {
                            continue;
                        }
                    }
                    
                    *visited.entry(packed).or_insert(0) = new_cost;
                    queue.push_back((next, new_cost));
                }
            }
        }
    }

    visited
}

fn pack_5pattern(pos: &[u8; 5]) -> u32 {
    /* packs with first index starting at LSB */
    let mut packed = 0u32;
    for i in (0..5).rev() {
        packed = (packed << 4) | (pos[i] as u32);
    }
    packed
}

fn unpack_5pattern(packed: u32) -> [u8; 5] {
    let mut unpacked = [0u8; 5];
    for i in 0..5 {
        unpacked[i] = ((packed >> i * 4) & 0xF as u32) as u8;
    }
    unpacked
}

fn can_move(pos: u8, n: u8, dir: u8) -> bool {
    match dir {
        0 => pos >= n,
        1 => pos < n * n - n,
        2 => pos % n > 0,
        _ => pos % n < n - 1,
    }
}

fn move_pos(pos: u8, n: u8, dir: u8) -> u8 {
    match dir {
        0 => pos - n,
        1 => pos + n,
        2 => pos - 1,
        _ => pos + 1,
    }
}

fn make_move_full(grid: &mut Vec<u8>, n: usize, z: usize, dir: u8) -> usize {
    //returns new zero
    if can_move_full(n, z, dir) {
        let swap = ext_get_swap(n, z, dir);
        grid[z] = grid[swap];
        grid[swap] = 0;
        return swap;
    }
    z
}

#[must_use]
fn can_move_full(n: usize, z: usize, dir: u8) -> bool {
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

fn encode_3x3(map: FxHashMap<Vec<u8>, u8>) -> Vec<u8> {
    let mut encoding = vec![0u8; 362_880];
    for (key, val) in map {
        let i = lehmer9(key.try_into().expect("uh oh"));
        encoding[i] = val;
    }
    encoding
}

fn encode_2x2(map: FxHashMap<Vec<u8>, u8>) -> Vec<u8> {
    let mut encoding = vec![0u8; 24]; //cute
    for (key, val) in map.into_iter() {
        let i = lehmer4(key.try_into().expect("uh oh"));
        encoding[i] = val;
    }
    encoding
}

fn compute_paths(n: usize) -> FxHashMap<Vec<u8>, u8> {
    /* Generates a hashmap where the keys are all possible configurations 
       of a n x n square, starting from the solved [1..0]. Because the
       generation uses BFS, every node is visited at the earliest possible
       distance, and the key is the *reverse* of the last move used to get
       there. Therefore, starting from an unsolved state, we can use the 
       values to hop to the solved state. This map will then be encoded in
       a list using Lehmer codes for lexicographic ordering. Note that for:

       3 x 3 -> 181,440 permutations, i.e. < 400kb (account for inaccessibles)
       2 x 2 -> 12 permutations, trivial

       but if we were to try 4x4 -> 10,461,394,944,000 so...                */

    const REVERSALS: [u8; 4] = [1, 0, 3, 2];
    let mut start: Vec<u8> = (1..=(n*n) as u8).collect::<Vec<u8>>();
    start[n * n - 1] = 0;

    let mut queue: VecDeque<Vec<u8>> = VecDeque::new();
    let mut visited: FxHashMap<Vec<u8>, u8> = FxHashMap::with_hasher(FxBuildHasher::default());
    visited.insert(start.clone(), 4);
    queue.push_back(start);

    while let Some(node) = queue.pop_front() {
        
        /* we could store the zero as a parameter as elsewhere but the cost is max 9 */
        let z = node.iter().position(|&x| x == 0).unwrap();

        for dir in 0..4 {
            if can_move_full(n, z, dir) {
                let mut next = node.clone();
                make_move_full(&mut next, n, z, dir);
                
                if visited.contains_key(&next) { continue; }

                visited.insert(next.clone(), REVERSALS[dir as usize]);
                queue.push_back(next);
            }
        }
    }
    visited
}