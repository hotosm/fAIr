import { useTrainingStatus } from "@/features/models/hooks/use-training";
import { useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { CodeBlock } from "@/components/ui/codeblock";
import { MODELS_CONTENT } from "@/constants";

export const TrainingLogs = ({
  taskId,
  expandByDefault = false,
  disableExpandButton = false,
}: {
  taskId: string;
  expandByDefault?: boolean;
  disableExpandButton?: boolean;
}) => {
  const { data, isPending } = useTrainingStatus(taskId);
  const [showLogs, setShowLogs] = useState<boolean>(expandByDefault);

  if (isPending) {
    return (
      <div className="h-40 col-span-5 w-full animate-pulse bg-light-gray"></div>
    );
  }
  return (
    <div className="col-span-3 flex flex-col gap-y-2 w-full">
      {!disableExpandButton && (
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-x-2 text-grey text-body-2"
        >
          <p>
            {MODELS_CONTENT.models.modelsDetailsCard.trainingInfoDialog.logs}
          </p>
          <ChevronDownIcon className={`icon ${showLogs && "rotate-180"}`} />
        </button>
      )}
      {showLogs && <CodeBlock content={data?.traceback as string} />}
    </div>
  );
};
