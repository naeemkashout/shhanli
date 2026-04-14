import { useState, useCallback } from "react";

export type OperationState = "idle" | "loading" | "success" | "error";

interface UseOperationStatusReturn {
  state: OperationState;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string;
  setLoading: () => void;
  setSuccess: () => void;
  setError: (message?: string) => void;
  reset: () => void;
  executeOperation: <T>(operation: () => Promise<T>) => Promise<T | undefined>;
}

export function useOperationStatus(): UseOperationStatusReturn {
  const [state, setState] = useState<OperationState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const setLoading = useCallback(() => {
    setErrorMessage("");
    setState("loading");
  }, []);
  const setSuccess = useCallback(() => {
    setErrorMessage("");
    setState("success");
  }, []);
  const setError = useCallback((message?: string) => {
    setErrorMessage(message || "");
    setState("error");
  }, []);
  const reset = useCallback(() => {
    setErrorMessage("");
    setState("idle");
  }, []);

  const executeOperation = useCallback(
    async <T>(operation: () => Promise<T>) => {
      try {
        setErrorMessage("");
        setState("loading");

        const result = await operation();

        if (result === false) {
          throw new Error("Operation failed");
        }

        if (
          typeof result === "object" &&
          result !== null &&
          "success" in result &&
          (result as { success?: boolean }).success === false
        ) {
          throw new Error(
            (result as { message?: string }).message || "Operation failed",
          );
        }

        setState("success");
        return result;
      } catch (error: any) {
        console.error("Operation failed:", error);
        setErrorMessage(error?.message || "Operation failed");
        setState("error");
      }
    },
    [],
  );

  return {
    state,
    isLoading: state === "loading",
    isSuccess: state === "success",
    isError: state === "error",
    errorMessage,
    setLoading,
    setSuccess,
    setError,
    reset,
    executeOperation,
  };
}
