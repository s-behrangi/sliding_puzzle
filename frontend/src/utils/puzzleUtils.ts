export function moveZero(board: number[], dir: number): number[] {
    const n = Math.sqrt(board.length);
    const z = board.indexOf(0);
    const swap = getSwap(n, z, dir);

    const newBoard = [...board];
    newBoard[z] = board[swap];
    newBoard[swap] = 0;

    return newBoard;
}

export function moveTile(board: number[], val: number): number[] {
    /* does NOT check if tile is movable */
    const swap = board.indexOf(val);
    const z = board.indexOf(0);

    const newBoard = [...board];
    newBoard[swap] = 0;
    newBoard[z] = val;

    return newBoard;
}

export function swapTiles(board: number[], val1: number, val2: number): number[] {
    /* good for allowing user to manually rearrange a board */
    const i = board.indexOf(val1);
    const j = board.indexOf(val2);

    board[i] = val2;
    board[j] = val1;

    return board;
}

export function isSolved(board: number[]): boolean {
    return ! board.map((val, i) => {
        if (i < board.length - 1) {
            return val === i + 1
        } else {
            return val === 0
        }
    }).some((val) => !val);
}

export function newBoard(n: number): number[] {
    return [...Array(n * n - 1).keys()].map(i => i + 1).concat(0)
}

export function isMovable(board: number[], n: number, val: number): boolean {
    /* determine if a particular tile is movable */
    const z = board.indexOf(0);
    const goal = board.indexOf(val);
    for (let dir = 0; dir < 4; dir++) {
        if (canMove(n, z, dir)) {
            if (getSwap(n, z, dir) == goal) {
                return true;
            }
        }
    }
    return false;
}

export function canMoveBoard(board: number[], dir: number): boolean {
    const n = Math.sqrt(board.length);
    const z = board.indexOf(0);
    return canMove(n, z, dir);
}

export function getDistances(board: number[]): number[] {
    const n = Math.sqrt(board.length);
    let hamming = 0;
    let manhattan = 0;
    board.map((val, i) => {
        if (val !== 0 && val - 1 !== i) hamming ++
        
        if (val !== 0) {
            const row = Math.trunc(i / n);
            const col = i % n;
            const e_row = Math.trunc((val - 1) / n);
            const e_col = (val - 1) % n;

            manhattan += Math.abs(e_row - row) + Math.abs(e_col - col);
        }
        
    })

    return [hamming, manhattan]
}

function canMove(n: number, z: number, dir: number): boolean {
    switch (dir) {
        case 0: return z >= n
        case 1: return z < n * n - n
        case 2: return (z % n) > 0
        case 3: return (z % n) <= n - 1
        default: return false
    }
}

function getSwap(n: number, z: number, dir: number): number {
    switch (dir) {
        case 0: return z - n 
        case 1: return z + n 
        case 2: return z - 1 
        case 3: return z + 1 
        default:return z
    }
}

export function verifyInputBoard(s: string): boolean {
    const sentence = s.trim().split(/[ ,]+/);
    const root = Math.floor(Math.sqrt(sentence.length));
    return  root * root === sentence.length
}

export function gobbleInputBoard(s: string): number[] {
    return s.trim().split(/[ ,]+/).map(val => Number(val))
}