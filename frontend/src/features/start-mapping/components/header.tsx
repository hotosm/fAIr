import ModelAction from "@/features/start-mapping/components/model-action";
import { BrandLogoWithDropDown } from "./logo-with-dropdown";
import { ButtonWithIcon } from "@/components/ui/button";
import { ChevronDownIcon } from "@/components/ui/icons";
import { DropDown } from "@/components/ui/dropdown";
import { DropdownPlacement, SHOELACE_SIZES } from "@/enums";
import { ELEMENT_DISTANCE_FROM_NAVBAR } from "@/config";
import { Map } from "maplibre-gl";
import { ModelDetailsButton } from "@/features/start-mapping/components/model-details-button";
import { ModelPredictionsTracker } from "@/features/start-mapping/components/model-predictions-tracker";
import { ModelSettings } from "@/features/start-mapping/components/model-settings";
import { SkeletonWrapper } from "@/components/ui/skeleton";
import { TDownloadOptions, TQueryParams } from "@/app/routes/start-mapping";
import { TModelDetails, TModelPredictions } from "@/types";
import { ToolTip } from "@/components/ui/tooltip";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { UserProfile } from "@/components/layout";
import { START_MAPPING_PAGE_CONTENT } from "@/constants";

const StartMappingHeader = ({
  modelInfo,
  modelPredictions,
  modelPredictionsExist,
  modelInfoRequestIsPending,
  modelInfoRequestIsError,
  query,
  updateQuery,
  setModelPredictions,
  disablePrediction,
  map,
  popupAnchorId,
  handleModelDetailsPopup,
  modelDetailsPopupIsActive,
  downloadOptions,
  clearPredictions,
  currentZoom,
}: {
  modelPredictionsExist: boolean;
  modelInfoRequestIsPending: boolean;
  modelInfoRequestIsError: boolean;
  modelInfo: TModelDetails;
  modelPredictions: TModelPredictions;
  query: TQueryParams;
  updateQuery: (newParams: TQueryParams) => void;
  setModelPredictions: React.Dispatch<React.SetStateAction<TModelPredictions>>;
  map: Map | null;
  disablePrediction: boolean;
  popupAnchorId: string;
  handleModelDetailsPopup: () => void;
  modelDetailsPopupIsActive: boolean;
  downloadOptions: TDownloadOptions;
  clearPredictions: () => void;
  currentZoom: number;
}) => {
  const { onDropdownHide, onDropdownShow, dropdownIsOpened } =
    useDropdownMenu();

  const {
    onDropdownHide: onFAIRLogoDropdownHide,
    onDropdownShow: onFAIRLogoDropdownShow,
    dropdownIsOpened: FAIRLogoDropdownIsOpened,
  } = useDropdownMenu();

  return (
    <SkeletonWrapper
      showSkeleton={modelInfoRequestIsPending || modelInfoRequestIsError}
      skeletonClassName="h-10"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <BrandLogoWithDropDown
            onClose={onFAIRLogoDropdownHide}
            onShow={onFAIRLogoDropdownShow}
            isOpened={FAIRLogoDropdownIsOpened}
          />
          <div className="flex flex-col md:flex-row md:items-center gap-x-4 z-10">
            <p
              title={modelInfo?.name}
              className="text-dark text-body-2base text-nowrap truncate md:max-w-[20px] lg:max-w-[300px] xl:max-w-[400px]"
            >
              {modelInfo?.name ?? "N/A"}
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
          <div className="flex flex-row items-center gap-y-3 gap-x-2">
            <ModelPredictionsTracker
              modelPredictions={modelPredictions}
              clearPredictions={clearPredictions}
            />
            <DropDown
              placement={DropdownPlacement.TOP_END}
              disableCheveronIcon
              dropdownIsOpened={dropdownIsOpened}
              onDropdownHide={onDropdownHide}
              onDropdownShow={onDropdownShow}
              menuItems={downloadOptions}
              distance={ELEMENT_DISTANCE_FROM_NAVBAR}
              triggerComponent={
                <ToolTip
                  content={
                    !modelPredictionsExist
                      ? START_MAPPING_PAGE_CONTENT.actions.disabledModeTooltip(
                          "see actions",
                        )
                      : null
                  }
                >
                  <ButtonWithIcon
                    uppercase={false}
                    onClick={dropdownIsOpened ? onDropdownHide : onDropdownShow}
                    suffixIcon={ChevronDownIcon}
                    label={START_MAPPING_PAGE_CONTENT.buttons.download.label}
                    size={SHOELACE_SIZES.SMALL}
                    textClassName="text-body-3"
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
            map={map}
            disablePrediction={disablePrediction}
            query={query}
            currentZoom={currentZoom}
            modelInfo={modelInfo}
          />
          <UserProfile hideFullName smallerSize />
        </div>
      </div>
    </SkeletonWrapper>
  );
};

export default StartMappingHeader;
