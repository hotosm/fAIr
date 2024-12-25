import { ButtonWithIcon } from "@/components/ui/button";
import { DropDown } from "@/components/ui/dropdown";
import { ChevronDownIcon } from "@/components/ui/icons";
import { SkeletonWrapper } from "@/components/ui/skeleton";

import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { TModel, TModelPredictions } from "@/types";
import { ModelSettings } from "@/features/start-mapping/components/model-settings";
import { TDownloadOptions, TQueryParams } from "@/app/routes/start-mapping";
import ModelAction from "@/features/start-mapping/components/model-action";
import { TModelPredictionsConfig } from "@/features/start-mapping/api/get-model-predictions";
import { SHOELACE_SIZES } from "@/enums";
import { UserProfile } from "@/components/layout";
import { startMappingPageContent } from "@/constants";
import { Map } from "maplibre-gl";
import { ToolTip } from "@/components/ui/tooltip";
import { ModelDetailsButton } from "@/features/start-mapping/components/model-details-button";
import { BrandLogoWithDropDown } from "./logo-with-dropdown";
import { ModelPredictionsTracker } from "@/features/start-mapping/components/model-predictions-tracker";
import { MobileDrawer } from "@/components/ui/drawer";

const StartMappingHeader = ({
  data,
  modelPredictions,
  modelPredictionsExist,
  trainingDatasetIsPending,
  query,
  updateQuery,
  trainingConfig,
  setModelPredictions,
  disablePrediction,
  map,
  popupAnchorId,
  handleModelDetailsPopup,
  modelDetailsPopupIsActive,
  downloadOptions,
}: {
  modelPredictionsExist: boolean;
  trainingDatasetIsPending: boolean;
  trainingDatasetIsError: boolean;
  data: TModel;
  modelPredictions: TModelPredictions;
  query: TQueryParams;
  updateQuery: (newParams: TQueryParams) => void;
  trainingConfig: TModelPredictionsConfig;
  setModelPredictions: React.Dispatch<React.SetStateAction<TModelPredictions>>;
  map: Map | null;
  disablePrediction: boolean;
  popupAnchorId: string;
  handleModelDetailsPopup: () => void;
  modelDetailsPopupIsActive: boolean;
  downloadOptions: TDownloadOptions;
}) => {
  const { onDropdownHide, onDropdownShow, dropdownIsOpened } =
    useDropdownMenu();

  const {
    onDropdownHide: onFAIRLogoDropdownHide,
    onDropdownShow: onFAIRLogoDropdownShow,
    dropdownIsOpened: FAIRLogoDropdownIsOpened,
  } = useDropdownMenu();

  return (
    <SkeletonWrapper showSkeleton={trainingDatasetIsPending}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <BrandLogoWithDropDown
            onClose={onFAIRLogoDropdownHide}
            onShow={onFAIRLogoDropdownShow}
            isOpened={FAIRLogoDropdownIsOpened}
          />
          <div className="flex flex-col md:flex-row md:items-center gap-x-4 z-10">
            <p
              title={data?.name}
              className="text-dark text-body-2base text-nowrap truncate md:max-w-[90px] lg:max-w-[250px] xl:max-w-[400px]"
            >
              {data?.name ?? "N/A"}
            </p>

            <ModelDetailsButton
              onClick={handleModelDetailsPopup}
              modelDetailsPopupIsActive={modelDetailsPopupIsActive}
              popupAnchorId={popupAnchorId}
            />
          </div>
        </div>
        <div className="flex flex-row items-center gap-x-4">
          <ModelSettings updateQuery={updateQuery} query={query} />
          <div className="flex flex-row items-center gap-y-3">
            <ModelPredictionsTracker modelPredictions={modelPredictions} />
            <DropDown
              placement="top-end"
              disableCheveronIcon
              dropdownIsOpened={dropdownIsOpened}
              onDropdownHide={onDropdownHide}
              onDropdownShow={onDropdownShow}
              menuItems={downloadOptions}
              triggerComponent={
                <ToolTip
                  content={
                    !modelPredictionsExist
                      ? startMappingPageContent.actions.disabledModeTooltip(
                          "see actions",
                        )
                      : null
                  }
                >
                  <ButtonWithIcon
                    uppercase={false}
                    onClick={dropdownIsOpened ? onDropdownHide : onDropdownShow}
                    suffixIcon={ChevronDownIcon}
                    label={startMappingPageContent.buttons.download.label}
                    size={SHOELACE_SIZES.SMALL}
                    variant="secondary"
                    disabled={!modelPredictionsExist}
                    iconClassName={
                      dropdownIsOpened ? "rotate-180 transition-all" : ""
                    }
                  />
                </ToolTip>
              }
            />
          </div>
          <ModelAction
            modelPredictions={modelPredictions}
            setModelPredictions={setModelPredictions}
            trainingConfig={trainingConfig}
            map={map}
            disablePrediction={disablePrediction}
          />
          <UserProfile hideFullName smallerSize />
        </div>
      </div>
    </SkeletonWrapper>
  );
};

export default StartMappingHeader;
