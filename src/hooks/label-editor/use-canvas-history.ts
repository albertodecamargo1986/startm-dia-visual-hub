import { useRef, useCallback } from 'react';
import type { Canvas as FabricCanvas } from 'fabric';

interface HistoryEntry {
  state: object;
  timestamp: number;
}

const MAX_HISTORY = 50;

export function useCanvasHistory(canvas: FabricCanvas | null) {
  const history = useRef<HistoryEntry[]>([]);
  const currentIdx = useRef(-1);
  const isRestoring = useRef(false);

  const captureState = useCallback(() => {
    if (!canvas || isRestoring.current) return;
    const currentState = canvas.toObject(['data']);

    // Truncate future history
    history.current = history.current.slice(0, currentIdx.current + 1);
    history.current.push({ state: currentState, timestamp: Date.now() });
    currentIdx.current++;

    if (history.current.length > MAX_HISTORY) {
      history.current.shift();
      currentIdx.current--;
    }
  }, [canvas]);

  const restoreState = useCallback(
    (state: object) => {
      if (!canvas) return;
      isRestoring.current = true;
      canvas.loadFromJSON(state).then(() => {
        canvas.requestRenderAll();
        isRestoring.current = false;
      });
    },
    [canvas],
  );

  const undo = useCallback(() => {
    if (currentIdx.current <= 0) return;
    currentIdx.current--;
    restoreState(history.current[currentIdx.current].state);
  }, [restoreState]);

  const redo = useCallback(() => {
    if (currentIdx.current >= history.current.length - 1) return;
    currentIdx.current++;
    restoreState(history.current[currentIdx.current].state);
  }, [restoreState]);

  const canUndo = currentIdx.current > 0;
  const canRedo = currentIdx.current < history.current.length - 1;

  return { captureState, undo, redo, canUndo, canRedo };
}
