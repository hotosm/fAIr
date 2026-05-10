import { TBaseModel } from "@/types";
import BaseModelCard from "@/features/base-models/components/base-model-card";

type BaseModelGridLayoutProps = {
  models: TBaseModel[];
};

const BaseModelGridLayout: React.FC<BaseModelGridLayoutProps> = ({
  models,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {models.map((model) => (
        <BaseModelCard key={model.id} model={model} />
      ))}
    </div>
  );
};

export default BaseModelGridLayout;
