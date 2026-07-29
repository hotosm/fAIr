import { useEffect, useState } from "react";
import { BaseModelStacItem } from "@/features/try-fair/api/stac";
import { useImageryCountry } from "@/features/try-fair/hooks/use-imagery-country";
import DropDown from "@/components/ui/dropdown/dropdown";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { ChevronDownIcon } from "@/components/ui/icons";
import { BuildingIcon } from "@/components/ui/icons/buildings-icon";
import { TreesIcon } from "@/components/ui/icons/trees-icon";
import { SwimmingPoolIcon } from "@/components/ui/icons/swimming-pool-icon";
import { ParkingIcon } from "@/components/ui/icons/parking-icon";
import { IconProps } from "@/types";
import { Button } from "@/components/ui/button";
import { GlobeSearchIcon } from "@/components/ui/icons/globe-search-icon";
import { ModelType } from "@/enums";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { useAuth } from "@/app/providers/auth-provider";
import { ImagerySource } from "@/features/try-fair/components/imagery/imagery-location-modal";
import { flagEmoji } from "@/features/try-fair/utils/common";

type ModelPickerProps = {
  selectedModel: BaseModelStacItem | null;
  onSelect: (model: BaseModelStacItem) => void;
  models: BaseModelStacItem[];
  loading?: boolean;
  disabled?: boolean;
  isSmallViewport: boolean;
  openMobileDialog?: () => void;
};

const FEATURE_ICONS: Record<string, React.FC<IconProps>> = {
  building: BuildingIcon,
  tree: TreesIcon,
  swimming_pool: SwimmingPoolIcon,
  parking: ParkingIcon,
};

const FeatureBadge = ({ label }: { label: string | undefined }) => {
  const Icon = FEATURE_ICONS[label ?? ""] ?? BuildingIcon;
  const featureLabel = (label ?? "").replace(/[-_]/g, " ");

  return (
    <span className="inline-flex gap-2 items-center px-2 py-0.5 capitalize rounded bg-grey text-white text-xs font-medium">
      <Icon />
      {featureLabel}
    </span>
  );
};

/** Radio indicator: filled primary dot when selected, empty grey ring otherwise. */
const RadioDot = ({ selected }: { selected: boolean }) => (
  <span
    className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
      selected ? "border-primary" : "border-gray-border"
    }`}
  >
    {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
  </span>
);

const CountryBadge = ({ country, code }: { country: string; code: string }) => (
  <span className="inline-flex gap-1.5 items-center px-2 py-0.5 rounded bg-grey text-white text-xs font-medium">
    <span aria-hidden>{flagEmoji(code)}</span>
    {country}
  </span>
);

export const ModelPicker: React.FC<ModelPickerProps> = ({
  selectedModel,
  onSelect,
  models,
  loading = false,
  disabled = false,
  isSmallViewport,
  openMobileDialog,
}) => {
  const { onDropdownHide, dropdownRef } = useDropdownMenu();
  const [isOpen, setIsOpen] = useState(false);
  const selectedLocation = [
    selectedModel?.properties["fair:preview_place"],
    selectedModel?.properties["fair:preview_country"],
  ]
    .filter(Boolean)
    .join(", ");
  const { currentModelType, selectedImagery } = useStartMappingStore();

  // When imagery is the active source, the trigger shows the imagery's name
  // instead of the default-location model title.
  const showImagery =
    currentModelType === ModelType.IMAGERY && !!selectedImagery;
  const imageryName =
    selectedImagery?.source === ImagerySource.OPEN_AERIAL_MAP
      ? selectedImagery.item.title
      : "Custom Imagery";

  const trigger = (
    <div className="flex justify-between items-center">
      <div className="w-full md:w-28 text-left flex-1 min-w-0">
        {loading ? (
          <p className="text-grey text-xs animate-pulse">Loading models…</p>
        ) : showImagery ? (
          <p className="font-medium text-dark text-xs leading-tight capitalize truncate">
            {imageryName}
          </p>
        ) : models.length === 0 ? (
          <p className="text-grey text-xs">No models available</p>
        ) : selectedModel ? (
          <>
            <p className="font-medium text-dark text-xs leading-tight">
              {selectedModel.properties.title}
            </p>
            {selectedLocation && (
              <p className="text-grey text-[10px] leading-tight truncate">
                {selectedLocation}
              </p>
            )}
          </>
        ) : (
          <p className="text-grey text-xs">Select a model</p>
        )}
      </div>

      <ChevronDownIcon
        className={`w-4 h-4 shrink-0 text-grey transition-transform ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </div>
  );

  if (isSmallViewport) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={openMobileDialog}
        className="w-full rounded-xl border px-3 py-2 bg-white"
      >
        {trigger}
      </button>
    );
  }

  return (
    <DropDown
      className="rounded-xl w-full md:w-32 !disabled:cursor-wait"
      disabled={disabled}
      ref={dropdownRef}
      onDropdownShow={() => setIsOpen(true)}
      onDropdownHide={() => setIsOpen(false)}
      disableCheveronIcon
      triggerComponent={trigger}
    >
      <div className="w-[520px] shadow-2xl">
        {
          <ModelPickerContent
            // Remount on each open so a staged-but-not-applied choice never
            // lingers when the dropdown is reopened.
            key={isOpen ? "open" : "closed"}
            models={models}
            selectedModel={selectedModel}
            onSelect={onSelect}
            onClose={onDropdownHide}
          />
        }
      </div>
    </DropDown>
  );
};

/**
 * Standalone content for the model picker, exported so it can be rendered
 * inside a page-level Dialog (outside the MobileDrawer).
 */
// Sentinel key for the selected imagery (model ids are STAC ids, never this).
const IMAGERY_KEY = "imagery";

type StagedChoice =
  | { type: "model"; model: BaseModelStacItem }
  | { type: "imagery" };

export const ModelPickerContent = ({
  selectedModel,
  onSelect,
  models,
  onClose,
}: {
  selectedModel: BaseModelStacItem | null;
  onSelect: (model: BaseModelStacItem) => void;
  models: BaseModelStacItem[];
  /** Close the picker after a choice is applied. */
  onClose?: () => void;
}) => {
  const { isAuthenticated } = useAuth();
  const {
    setShowChooseLocationModal,
    setShowSigninModal,
    setCurrentModelType,
    currentModelType,
    selectedImagery,
  } = useStartMappingStore();

  // The choice is staged locally and only committed on Apply, so picking a
  // default location (or the imagery) doesn't change the map until Apply.
  const [staged, setStaged] = useState<StagedChoice | null>(null);

  // Drop the staged choice whenever the committed selection changes underneath.
  useEffect(() => {
    setStaged(null);
  }, [selectedModel, currentModelType]);

  // Derive the imagery's country by reverse-geocoding its center (the tile URL
  // carries no location), shown as a badge on the imagery card. Works for any
  // source that has bounds (custom imagery may not).
  const imageryCountry = useImageryCountry(selectedImagery?.bounds ?? null);

  const isOamImagery =
    selectedImagery?.source === ImagerySource.OPEN_AERIAL_MAP;
  // OAM imagery uses its STAC item title; custom imagery has none, so it's
  // named by its reverse-geocoded place (falling back to "Custom Imagery"),
  // with a "Custom" source label.
  const imageryTitle = isOamImagery
    ? selectedImagery.item.title
    : (imageryCountry?.place ?? "Custom Imagery");
  const imagerySourceLabel = isOamImagery ? "OpenAerialMap" : "Custom";

  // Identify a selection by a single key — "imagery" for the selected imagery,
  // or a model id for a default location. Collapsing both mutually-exclusive
  // sources into one value turns every check below into a plain comparison.
  const keyOf = (choice: StagedChoice): string =>
    choice.type === "imagery" ? IMAGERY_KEY : choice.model.id;

  const committedKey =
    currentModelType === ModelType.IMAGERY
      ? IMAGERY_KEY
      : (selectedModel?.id ?? null);
  const stagedKey = staged ? keyOf(staged) : null;

  // What the picker highlights: the staged choice if any, else the committed one.
  const activeKey = stagedKey ?? committedKey;
  const imageryActive = activeKey === IMAGERY_KEY;

  // Apply is enabled only when a staged choice differs from what's committed.
  const hasChange = stagedKey !== null && stagedKey !== committedKey;

  const handleApply = () => {
    if (!staged) return;
    if (staged.type === "model") {
      onSelect(staged.model);
    } else {
      setCurrentModelType(ModelType.IMAGERY);
    }
    setStaged(null);
    onClose?.();
  };

  return (
    <div className="bg-white rounded-xl p-2 md:p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      {selectedImagery && (
        <button
          key="imagery"
          type="button"
          onClick={() => setStaged({ type: "imagery" })}
          className={`text-left p-3 w-full sm:w-1/2 bg-frosted-blue rounded-lg  transition-colors ${
            imageryActive ? "border-primary border-2" : ""
          }`}
        >
          <div className="flex space-y-2 items-start justify-between gap-2 mb-1">
            <p className="text-dark capitalize text-sm font-medium leading-tight ">
              {imageryTitle}
            </p>

            <RadioDot selected={imageryActive} />
          </div>
          <p className="text-grey text-xs">Imagery: {imagerySourceLabel}</p>
          {imageryCountry && (
            <div className="mt-2">
              <CountryBadge
                country={imageryCountry.country}
                code={imageryCountry.countryCode}
              />
            </div>
          )}
        </button>
      )}
      <div className="flex items-center gap-3">
        <p className="text-grey text-xs shrink-0">Default Locations</p>
        <div className="h-px bg-gray-border flex-1" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {models.length > 0 ? (
          models.map((model) => {
            const isSelected = activeKey === model.id;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => setStaged({ type: "model", model })}
                className={`text-left p-3 bg-frosted-blue rounded-lg  transition-colors ${
                  isSelected ? "border-primary border-2" : ""
                }`}
              >
                <div className="flex space-y-2 items-start justify-between gap-2 mb-1">
                  <p className="text-dark capitalize text-sm font-bold leading-tight">
                    {model?.properties?.title ?? ""}
                  </p>

                  <RadioDot selected={isSelected} />
                </div>
                <p className="text-grey text-xs mb-0.5">
                  Model: {model?.properties?.["mlm:name"] ?? ""}
                </p>
                <p className="text-grey text-xs mb-2">
                  By: {model?.properties?.providers[0]?.name ?? ""}
                </p>
                <FeatureBadge label={model?.properties?.keywords[0] ?? ""} />
              </button>
            );
          })
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center py-10 px-4 text-center">
            <p className="text-dark font-semibold text-sm mb-1">
              No models available
            </p>
            <p className="text-grey text-xs max-w-xs">
              There are currently no models available for use.{" "}
            </p>
          </div>
        )}
      </div>
      <div className="flex w-full text-sm justify-between items-center ">
        <Button
          type="button"
          size="medium"
          className="flex gap-2 !w-fit items-center"
          rounded
          fontSize="12px"
          disabled={!hasChange}
          onClick={handleApply}
        >
          Apply
        </Button>

        <button
          className="flex gap-2 items-center"
          onClick={() => {
            if (isAuthenticated) {
              setShowChooseLocationModal(true);
            } else {
              setShowSigninModal(true);
            }
          }}
        >
          <GlobeSearchIcon className="text-primary" />
          <span className="text-primary">Map a different location</span>
          <ChevronDownIcon className="size-4 text-primary -rotate-90" />
        </button>
      </div>
    </div>
  );
};
