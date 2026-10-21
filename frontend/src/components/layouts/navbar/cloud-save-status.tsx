import { useEffect, useState } from "react";
import { SaveToCloudIcon } from "@/components/ui/icons/cloud-download-icon";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";

export const CloudSaveStatus = () => {
  const lastSavedAt = useStartMappingStore((state) => state.lastSavedAt);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const remaining =
      lastSavedAt === null ? 0 : lastSavedAt + 3000 - Date.now();
    setVisible(remaining > 0);
    if (remaining <= 0) return;

    const timer = window.setTimeout(() => setVisible(false), remaining);
    return () => window.clearTimeout(timer);
  }, [lastSavedAt]);

  return (
    <div role="status" className="flex flex-row items-center gap-x-1">
      {visible && (
        <>
          <SaveToCloudIcon className="size-4" />
          <p className="italic text-xs">Saved to cloud</p>
        </>
      )}
    </div>
  );
};
