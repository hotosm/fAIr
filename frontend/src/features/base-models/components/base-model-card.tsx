import { Link } from "@/components/ui/link";
import { APPLICATION_ROUTES } from "@/constants";
import { TBaseModel } from "@/types";
import { roundNumber } from "@/utils/number-utils";

type BaseModelCardProps = {
  model: TBaseModel;
};

const BaseModelCard: React.FC<BaseModelCardProps> = ({ model }) => {
  return (
    <Link
      nativeAnchor={false}
      disableLinkStyle
      href={`${APPLICATION_ROUTES.BASE_MODELS_HOME}/${model.id}`}
      title={model.name}
      className="w-full flex flex-col border border-gray-border hover:shadow-md transition-shadow duration-200 p-6 gap-y-4"
    >
      {/* Model Name */}
      <h3 className="font-semibold text-title-2 text-dark">{model.name}</h3>

      {/* Description */}
      <p className="text-grey text-body-2base line-clamp-3 min-h-[60px]">
        {model.description}
      </p>

      {/* Accuracy */}
      <div className="flex flex-col gap-y-1">
        <p className="text-grey text-body-3">Accuracy:</p>
        <p className="text-dark font-bold text-title-3">
          {roundNumber(model.accuracy)}
        </p>
      </div>

      {/* Author & Date */}
      <div className="flex flex-col gap-y-1 mt-auto">
        <p className="font-semibold text-body-2base text-dark">
          {model.author}
        </p>
        <p className="text-grey text-body-3">
          Last Modified: <span className="font-bold">{model.lastModified}</span>
        </p>
      </div>
    </Link>
  );
};

export default BaseModelCard;
