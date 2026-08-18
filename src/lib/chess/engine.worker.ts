/// <reference lib="webworker" />
import { findBestMove } from "./search";
import type { EngineLevel } from "./levels";

export interface EngineRequest {
  id: number;
  fen: string;
  history: string[];
  level: EngineLevel;
}

self.onmessage = (event: MessageEvent<EngineRequest>) => {
  const { id, fen, history, level } = event.data;
  try {
    const result = findBestMove(fen, history, level);
    (self as unknown as Worker).postMessage({ id, result });
  } catch (error) {
    (self as unknown as Worker).postMessage({ id, result: null, error: String(error) });
  }
};
