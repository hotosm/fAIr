import { APPLICATION_ROUTES, MODELS_CONTENT } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { extractDatePart } from "@/utils";
import { FairModelPlaceholderImage } from "@/assets/images";
import { Image } from "@/components/ui/image";
import { Link } from "@/components/ui/link";
import { roundNumber } from "@/utils/number-utils";
import { TBadgeVariants, TModel } from "@/types";
import { truncateString } from "@/utils";
import { useLocation } from "react-router-dom";

type ModelCardProps = {
  model: TModel;
};

const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
  // on my-models page, add a badge to the model card
  const { pathname } = useLocation();
  const canAddStatusBadge = pathname === APPLICATION_ROUTES.PROFILE_MODELS;
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
    <div className="flex w-full  items-center">
      <Link
        nativeAnchor={false}
        disableLinkStyle
        href={`${APPLICATION_ROUTES.MODELS}/${model.id}`}
        title={model.name}
        className="group  mx-auto flex h-auto w-full flex-col overflow-hidden border border-gray-border hover:shadow-md md:max-w-[300px]"
      >
        <div className="relative h-[200px] w-full">
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
            className="size-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
          {canAddStatusBadge && (
            <div className="absolute right-2 top-2">
              <Badge variant={statusToBadgeVariant[String(model.status)]}>
                {statusMapping[String(model.status)]}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex h-[320px] flex-col gap-y-6 p-5">
          <div className="inline-flex grow flex-col gap-y-2">
            <p className="line-clamp-2 h-16 text-body-1 font-medium text-black">
              {truncateString(model.name, 50)}
            </p>
            <p className="text-body-2 text-grey">
              ID: <span>{model.id}</span>
            </p>
          </div>
          {/* accuracy */}
          <div>
            <p className="text-body-3 text-grey">
              {MODELS_CONTENT.models.modelsList.modelCard.accuracy}
            </p>
            <p className="text-body-2 font-semibold text-dark">
              {roundNumber(model.accuracy ?? 0)} %
            </p>
          </div>
          {/* Status badge */}

          {/* Name, date and base model */}
          <div className="inline-flex grow flex-col gap-y-2">
            <p className="text-body-2base font-semibold text-dark">
              {model.user.username}
            </p>
            <p className="text-body-3 text-grey">
              {MODELS_CONTENT.models.modelsList.modelCard.lastModified}{" "}
              <span className="font-bold">
                {extractDatePart(model.last_modified)}
              </span>
            </p>
            <p className="flex gap-x-2 text-body-3 text-grey">
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
