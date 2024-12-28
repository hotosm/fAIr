import { TBadgeVariants, TModel } from "@/types";
import { Image } from "@/components/ui/image";
import { APPLICATION_ROUTES, MODELS_CONTENT } from "@/constants";
import { extractDatePart } from "@/utils";
import { Link } from "@/components/ui/link";
import { truncateString } from "@/utils";
import { roundNumber } from "@/utils/number-utils";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { FairModelPlaceholderImage } from "@/assets/images";

type ModelCardProps = {
  model: TModel;
};

const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
  // on my-models page, add a badge to the model card
  const { pathname } = useLocation();
  const canAddStatusBadge = pathname === APPLICATION_ROUTES.ACCOUNT_MODELS;
  const statusToBadgeVariant: Record<string, TBadgeVariants> = {
    "-1": "blue", //draft
    "0": "green", //published
    "1": "red", // archived
  };
  const statusMapping: Record<string, string> = {
    "-1": "Draft", //draft
    "0": "Published", //published
    "1": "Archived", // archived
  };

  return (
    <div className="flex items-center  w-full">
      <Link
        nativeAnchor={false}
        disableLinkStyle
        href={`${APPLICATION_ROUTES.MODELS}/${model.id}`}
        title={model.name}
        className="w-full  md:max-w-[300px] mx-auto h-auto flex flex-col border border-gray-border hover:shadow-md overflow-hidden group"
      >
        <div className="h-[200px] w-full relative">
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
          {canAddStatusBadge && (
            <div className="absolute top-2 right-2">
              <Badge variant={statusToBadgeVariant[String(model.status)]}>
                {statusMapping[String(model.status)]}
              </Badge>
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col gap-y-6 h-[320px]">
          <div className="inline-flex flex-col gap-y-2 flex-grow">
            <p className="font-medium text-body-1 text-black line-clamp-2">
              {truncateString(model.name, 50)}
            </p>
            <p className="text-gray text-body-2">
              ID: <span>{model.id}</span>
            </p>
          </div>
          {/* accuracy */}
          <div>
            <p className="text-gray text-body-3">
              {MODELS_CONTENT.models.modelsList.modelCard.accuracy}
            </p>
            <p className="text-dark font-semibold text-body-2">
              {roundNumber(model.accuracy ?? 0)} %
            </p>
          </div>
          {/* Status badge */}

          {/* Name, date and base model */}
          <div className="inline-flex flex-col gap-y-2 flex-grow">
            <p className="font-semibold text-body-2base text-dark">
              {model.user.username}
            </p>
            <p className="text-gray text-body-3">
              {MODELS_CONTENT.models.modelsList.modelCard.lastModified}{" "}
              <span className="font-bold">
                {extractDatePart(model.last_modified)}
              </span>
            </p>
            <p className="text-gray text-body-3 flex gap-x-2">
              {MODELS_CONTENT.models.modelsList.modelCard.baseModel}
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
