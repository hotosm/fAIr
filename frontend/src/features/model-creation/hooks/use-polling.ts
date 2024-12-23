import { useState, useEffect, useRef } from "react";
import { LabelStatus } from "@/enums/training-area";
import { TTrainingAreaFeature } from "@/types";

type PollingHookReturn = {
  status: LabelStatus;
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
  error: boolean;
}

export const usePolling = (
  taskId: number,
  fetchTaskStatus: (id: number) => Promise<TTrainingAreaFeature>,
  interval: number = 5000
): PollingHookReturn => {
  const [status, setStatus] = useState<LabelStatus>(LabelStatus.NOT_DOWNLOADED);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const startPolling = () => {
    setIsPolling(true);
    setError(false);
    pollTask();
  };

  const pollTask = async () => {
    try {
      const res = await fetchTaskStatus(taskId);

      if (res?.properties?.label_status === LabelStatus.DOWNLOADED) {
        setStatus(LabelStatus.DOWNLOADED);
        stopPolling();
      } else if (res?.properties?.label_status === LabelStatus.NOT_DOWNLOADED) {
        setStatus(LabelStatus.NOT_DOWNLOADED);
        retryPolling();
      }
    } catch (err) {
      setError(true);
      stopPolling();
    }
  };

  const retryPolling = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(pollTask, interval);
  };

  const stopPolling = () => {
    setIsPolling(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { status, isPolling, startPolling, stopPolling, error };
};
