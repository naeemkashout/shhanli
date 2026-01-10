import { useState, useCallback } from "react";

export type OperationState = "idle" | "loading" | "success" | "error";

interface UseOperationStatusReturn {
  state: OperationState;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  setLoading: () => void;
  setSuccess: () => void;
  setError: () => void;
  reset: () => void;
  executeOperation: (operation: () => Promise<void>) => Promise<void>;
}

export function useOperationStatus(): UseOperationStatusReturn {
  const [state, setState] = useState<OperationState>("idle");

  const setLoading = useCallback(() => setState("loading"), []);
  const setSuccess = useCallback(() => setState("success"), []);
  const setError = useCallback(() => setState("error"), []);
  const reset = useCallback(() => setState("idle"), []);

  const executeOperation = useCallback(
    async (operation: () => Promise<void>) => {
      try {
        setState("loading");
        await operation();
        setState("success");
      } catch (error) {
        console.error("Operation failed:", error);
        setState("error");
      }
    },
    []
  );

  return {
    state,
    isLoading: state === "loading",
    isSuccess: state === "success",
    isError: state === "error",
    setLoading,
    setSuccess,
    setError,
    reset,
    executeOperation,
  };
}
