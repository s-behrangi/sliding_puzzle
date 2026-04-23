import init, {
    SlidingPuzzle
} from './pkg/lib.js';

type WorkerMessage = 
 | { type: 'GET_SCRAMBLED'; args: { n:      number;     style:  number } }
 | { type: 'IS_SOLVABLE';   args: { board:  Uint8Array } }
 | { type: 'SOLVE';         args: { board:  Uint8Array; alg:    number } }
 | { type: 'GET_DIST';      args: { board: Uint8Array} };

type WorkerResponse = 
 | { type: 'INITIALIZED' }
 | { type: 'SCRAMBLED'; args: { board:      Uint8Array } }
 | { type: 'SOLVABLE';  args: { solvable:   boolean } }
 | { type: 'SOLUTION';  args: { solution:   Uint8Array } }
 | { type: 'DIST';      args: { distance: number } }
 | { type: 'ERROR';     args: { message:    string } };

let wasmModule: any = null;

async function initializeWasm() {
    try {
        wasmModule = await init();
        postMessage({ type: 'INITIALIZED' } as WorkerResponse);
    } catch (error) {
        postMessage({
            type: 'ERROR',
            args: { message: `WASM init failed: ${error}`},
        } as WorkerResponse);
    }
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    if (!wasmModule) {
        await initializeWasm();
        if (!wasmModule) return;
    }

    const { type, args } = e.data;

    try {
        switch (type) {
            case 'GET_SCRAMBLED': {
                const { n, style }  = args;
                const scrambled: Uint8Array = SlidingPuzzle.wasm_get_scrambled(n, style);
                postMessage(
                    { type: 'SCRAMBLED', args: { board: scrambled } },
                    { transfer: [scrambled.buffer] }
                );
                break;
            }
            case 'IS_SOLVABLE': {
                const { board } = args;
                const solvable: boolean = SlidingPuzzle.wasm_solvable_from(board);
                postMessage(
                    { type: 'SOLVABLE', args: { solvable }}
                );
                break;
            }
            case 'SOLVE': {
                const { board, alg } = args;
                const solution: Uint8Array = SlidingPuzzle.wasm_solve_from(board, alg);
                postMessage(
                    { type: 'SOLUTION', args: { solution }},
                    { transfer: [solution.buffer] }  
                );
                break;
            }
            case 'GET_DIST': {
                const { board } = args;
                const dist: number = SlidingPuzzle.wasm_get_lin_conflict_distance(board);
                postMessage(
                    { type: 'DIST', args: { distance: dist }}
                );
                break;
            }
            default: {
                console.warn('Invalid message type:', type);
            }
        }
    } catch (error) {
        postMessage(
            { type: 'ERROR', args: { message: `Failed: ${error}` } } as WorkerResponse
        )
    }
};

initializeWasm();