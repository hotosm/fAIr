import ModelCard from "@/features/models/components/model-card";
import { TModel } from "@/types";
import { ModelListSkeleton } from "../components/skeletons/model-list-skeleton";

type ModelListProps = {
  models?: TModel[];
  isPending: boolean;
  isError: boolean;
};

const ModelListGridLayout: React.FC<ModelListProps> = ({
  models,
  isPending,
  isError,
}) => {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-x-4 gap-y-10">
      {isPending || isError ? (
        <ModelListSkeleton />
      ) : (
        models?.map((model, id) => (
          <ModelCard key={`model-${id}`} model={model} />
        ))
      )}
    </div>
  );
};

export default ModelListGridLayout;
