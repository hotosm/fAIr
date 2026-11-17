import { useEffect, useState } from "react";
import type { PredictionStage } from "@/features/try-fair/hooks/use-fair-predict";

const LABELS: Record<PredictionStage["name"], string> = {
  waking: "Waking up the model",
  predicting: "Running the prediction",
};

/** The running prediction's stage and how long it has taken so far. */
export const PredictionStatus = ({
  stage,
}: {
  stage: PredictionStage | null;
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!stage) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [stage]);

  if (!stage) return null;
  const seconds = Math.max(0, Math.floor((now - stage.startedAt) / 1_000));
  return (
    <p role="status" aria-live="polite" className="pb-2 text-xs text-grey">
      {LABELS[stage.name]} <span aria-hidden="true">({seconds} s)</span>
    </p>
  );
};
