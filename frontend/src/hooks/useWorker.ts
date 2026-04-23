import { useRef, useEffect, useState, useCallback } from 'react';

export function useWorker() {
    const workerRef = useRef<Worker>(undefined);
    const [isReady, setIsReady] = useState(false);
    const [isWorking, setIsWorking] = useState(false);

    useEffect(() => {
        workerRef.current = new Worker(new URL('../bridge.worker.ts', import.meta.url), {
            type: 'module',
        })

        workerRef.current.onmessage = (e) => {
            if (e.data.type === 'INITIALIZED') {
                setIsReady(true);
            }
        };

        return () => workerRef.current?.terminate();
    }, []);

    const scramble = useCallback(async (n: number, style: number) => {
        return new Promise<number[]>((resolve, reject) => {
            if (!workerRef.current) return reject('Worker not ready');

            setIsWorking(true);
            const handler = (e: MessageEvent) => {
                workerRef.current?.removeEventListener('message', handler);
                setIsWorking(false);

                if (e.data.type === 'SCRAMBLED') {
                    resolve([...e.data.args.board]);
                } else if (e.data.type === 'ERROR') {
                    reject(e.data.args.message);
                }
            };

            workerRef.current.addEventListener('message', handler);
            workerRef.current.postMessage({ type: 'GET_SCRAMBLED' , args: { n, style } });
        });
    }, []);

    const isSolvable = useCallback(async (board: number[]) => {
        return new Promise<Boolean>((resolve, reject) => {
            if (!workerRef.current) return reject('Worker not ready');

            setIsWorking(true);
            const handler = (e: MessageEvent) => {
                workerRef.current?.removeEventListener('message', handler);
                setIsWorking(false);

                if (e.data.type === 'SOLVABLE') {
                    resolve(e.data.args.solvable);
                } else if (e.data.type === 'ERROR') {
                    reject(e.data.args.message);
                }
            };

            workerRef.current.addEventListener('message', handler);
            workerRef.current.postMessage({ type: 'IS_SOLVABLE' , args: { board } });
        })
    }, []);

    const solve = useCallback(async (board: number[], alg: string) => {
        let algorithm: number;

        switch (alg) {
            case 'astar':
                algorithm = 0;
                break;
            case 'idastar':
                algorithm = 1;
                break;
            case 'reduction':
                algorithm = 2;
                break;
            default:
                algorithm = 3;
                break;
        }

        return new Promise<number[]>((resolve, reject) => {
            if (!workerRef.current) return reject('Worker not ready');

            setIsWorking(true);
            const handler = (e: MessageEvent) => {
                workerRef.current?.removeEventListener('message', handler);
                setIsWorking(false);

                if (e.data.type === 'SOLUTION') {
                    resolve([...e.data.args.solution]);
                } else if (e.data.type === 'ERROR') {
                    reject(e.data.args.message);
                }
            };

            workerRef.current.addEventListener('message', handler);
            workerRef.current.postMessage({ type: 'SOLVE' , args: { board, alg: algorithm } });
        })
    }, []);

    const distance = useCallback(async (board: number[]) => {
        return new Promise<number>((resolve, reject) => {
            if (!workerRef.current) return reject('Worker not ready');

            setIsWorking(true);
            const handler = (e: MessageEvent) => {
                workerRef.current?.removeEventListener('message', handler);
                setIsWorking(false);

                if (e.data.type === 'DIST'){
                    resolve(e.data.args.distance);
                } else if (e.data.type === 'ERROR') {
                    reject(e.data.args.message);
                }
            }

            workerRef.current.addEventListener('message', handler);
            workerRef.current.postMessage({ type: 'GET_DIST' , args: { board } });
        })
    }, [])

    return { isReady, isWorking, scramble, isSolvable, solve, distance};
}