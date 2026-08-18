import { useCallback, useEffect, useRef, useState } from "react";
import type { EngineLevel } from "./levels";
import type { SearchResult } from "./search";

/**
 * Runs the chess engine in a Web Worker so the board never freezes.
 * Requests are cancellable: starting a new search or unmounting drops the
 * pending result.
 */
export function useEngine() {
  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const [thinking, setThinking] = useState(false);
  const [info, setInfo] = useState<SearchResult | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("./engine.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const cancel = useCallback(() => {
    requestId.current += 1;
    setThinking(false);
  }, []);

  const think = useCallback(
    (fen: string, history: string[], level: EngineLevel): Promise<SearchResult | null> => {
      const worker = workerRef.current;
      if (!worker) return Promise.resolve(null);
      requestId.current += 1;
      const id = requestId.current;
      setThinking(true);
      return new Promise((resolve) => {
        const handler = (event: MessageEvent<{ id: number; result: SearchResult | null }>) => {
          if (event.data.id !== id) return;
          worker.removeEventListener("message", handler);
          if (requestId.current !== id) return resolve(null);
          setThinking(false);
          setInfo(event.data.result);
          resolve(event.data.result);
        };
        worker.addEventListener("message", handler);
        worker.postMessage({ id, fen, history, level });
      });
    },
    [],
  );

  return { think, cancel, thinking, info };
}
