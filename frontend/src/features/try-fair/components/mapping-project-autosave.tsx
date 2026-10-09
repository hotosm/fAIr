import { useEffect, useRef, useState } from "react";
import {
  type MappingUserState,
  useSaveUserState,
  useUpdateUserState,
} from "@/features/try-fair/api/user-state";

/** Mounted only for a signed-in user; starts saving after a successful prediction. */
export const MappingProjectAutosave = ({
  enabled,
  initialPid,
  payload,
  skipInitialSave = false,
}: {
  enabled: boolean;
  initialPid?: number;
  payload: MappingUserState | null;
  skipInitialSave?: boolean;
}) => {
  const [pid, setPid] = useState(initialPid);
  const lastAttempt = useRef<string | null>(null);
  const { mutateAsync: create, isPending: isCreating } = useSaveUserState();
  const { mutateAsync: update, isPending: isUpdating } = useUpdateUserState();
  const snapshot = JSON.stringify(payload);
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!enabled || !payload || isPending || lastAttempt.current === snapshot) return;
    if (skipInitialSave && lastAttempt.current === null) {
      lastAttempt.current = snapshot;
      return;
    }

    const timer = window.setTimeout(async () => {
      lastAttempt.current = snapshot;
      try {
        if (pid !== undefined) {
          await update({ pid, payload });
        } else {
          const saved = await create(payload);
          setPid(saved.pid);
        }
      } catch {
        // Keep mapping usable. A subsequent change can try saving again;
        // never repeatedly submit the same failing snapshot.
      }
    }, 750);

    return () => window.clearTimeout(timer);
    // Compare the serialized value so unrelated page renders don't restart the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, snapshot, pid, isPending, create, update, skipInitialSave]);

  return null;
};
