import { TModel } from "@/types";
import FairModelPlaceholderImage from "@/assets/images/model_placeholder_image.png";
import { Image } from "@/components/ui/image";
import { APP_CONTENT, APPLICATION_ROUTES, extractDatePart } from "@/utils";
import { Link } from "@/components/ui/link";
import { truncateString } from "@/utils";
import { roundNumber } from "@/utils/number-utils";

type ModelCardProps = {
  model: TModel;
};

const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
  return (
    <div className="flex items-center  w-full">
      <Link
        nativeAnchor={false}
        disableLinkStyle
        href={`${APPLICATION_ROUTES.MODELS}/${model.id}`}
        title={model.name}
        className="w-full  md:max-w-[300px] mx-auto h-auto flex flex-col border border-gray-border hover:shadow-md overflow-hidden group"
      >
        <div className="h-[200px] w-full">
          <Image
            height="256px"
            width="256px"
            src={
              model.thumbnail_url
                ? `${model.thumbnail_url}.png`
                : FairModelPlaceholderImage
            }
            alt={model.name}
            placeHolder={FairModelPlaceholderImage}
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
        </div>
        <div className="p-5 flex flex-col gap-y-6">
          <div className="inline-flex flex-col gap-y-2">
            <p className="font-medium text-body-1 text-black">
              {truncateString(model.name, 20)}
            </p>
            <p className="text-gray text-body-2">
              ID: <span>{model.id}</span>
            </p>
          </div>
          {/* accuracy */}
          <div>
            <p className="text-gray text-body-3">
              {APP_CONTENT.models.modelsList.modelCard.accuracy}
            </p>
            <p className="text-dark font-semibold text-body-2">
              {roundNumber(model.accuracy ?? 0)} %
            </p>
          </div>
          {/* Name, date and base model */}
          <div className="inline-flex flex-col gap-y-2">
            <p className="font-semibold text-body-2base text-dark">
              {model.user.username}
            </p>
            <p className="text-gray text-body-3">
              {APP_CONTENT.models.modelsList.modelCard.lastModified}{" "}
              <span className="font-bold">
                {extractDatePart(model.last_modified)}
              </span>
            </p>
            <p className="text-gray text-body-3 flex gap-x-2">
              {APP_CONTENT.models.modelsList.modelCard.baseModel}
              <span className="font-bold text-dark">
                {extractDatePart(model.base_model)}
              </span>
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ModelCard;
