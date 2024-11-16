import { useMap } from "@/app/providers/map-provider";
import { MapComponent, MapCursorToolTip } from "@/components/map";
import { Button, ButtonWithIcon } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { DropDown } from "@/components/ui/dropdown";
import { FormLabel, Input, Select, Switch } from "@/components/ui/form";
import { ChevronDownIcon, TagsInfoIcon } from "@/components/ui/icons";
import { Popup } from "@/components/ui/popup";
import { SkeletonWrapper } from "@/components/ui/skeleton";
import { INPUT_TYPES, SHOELACE_SIZES } from "@/enums";
import { useModelDetails } from "@/features/models/hooks/use-models";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";
import { useToolTipVisibility } from "@/hooks/use-tooltip-visibility";
import { APPLICATION_ROUTES, showErrorToast, truncateString } from "@/utils";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const zoomInMessage = "Zoom in to at least zoom 19 to start mapping.";

const SEARCH_PARAMS = {
  useJOSMQ: "useJOSMQ",
  confidenceLevel: "confidenceLevel",
  tolerance: "tolerance",
  area: "area",
};

const defaultQueries = {
  [SEARCH_PARAMS.useJOSMQ]: false,
  [SEARCH_PARAMS.confidenceLevel]: 90,
  [SEARCH_PARAMS.tolerance]: 0.3,
  [SEARCH_PARAMS.area]: 4,
};

type TQueryParams = typeof defaultQueries;

const confidenceLevels = [
  {
    name: "25%",
    value: 25,
  },
  {
    name: "50%",
    value: 50,
  },
  {
    name: "75%",
    value: 75,
  },
  {
    name: "90%",
    value: 90,
  },
];

export const StartMappingPage = () => {
  const { modelId } = useParams();
  const { isError, isPending, data, error } = useModelDetails(
    modelId as string,
  );
  const navigate = useNavigate();
  const { currentZoom } = useMap();

  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState<TQueryParams>(defaultQueries);
  const { tooltipPosition, tooltipVisible } = useToolTipVisibility();
  const { onDropdownHide, onDropdownShow, dropdownIsOpened } =
    useDropdownMenu();
  const [showModelDetails, setShowModelDetails] = useState<boolean>(false);

  useEffect(() => {
    if (isError) {
      showErrorToast(error);
      if (error.status.code === 404) {
        navigate(APPLICATION_ROUTES.NOTFOUND);
      }
    }
  }, [error, isError]);

  const updateQuery = useCallback(
    (newParams: TQueryParams) => {
      setQuery((prevQuery) => ({
        ...prevQuery,
        ...newParams,
      }));
      const updatedParams = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value) {
          updatedParams.set(key, String(value));
        } else {
          updatedParams.delete(key);
        }
      });
      setSearchParams(updatedParams);
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const newQuery = {
      [SEARCH_PARAMS.useJOSMQ]: Boolean(
        searchParams.get(SEARCH_PARAMS.useJOSMQ),
      ),
      [SEARCH_PARAMS.confidenceLevel]: Number(
        searchParams.get(SEARCH_PARAMS.confidenceLevel),
      ),
      [SEARCH_PARAMS.tolerance]: Number(
        searchParams.get(SEARCH_PARAMS.tolerance),
      ),
      [SEARCH_PARAMS.area]: Number(searchParams.get(SEARCH_PARAMS.area)),
    };
    setQuery(newQuery);
  }, []);

  const disableButtons = currentZoom < 19;

  const downloadButtonDropdownOptions = [
    {
      name: "All Features as GeoJSON",
      value: "All Features as GeoJSON",
    },
    {
      name: "Mapped Features Only",
      value: "Mapped Features Only",
    },
    {
      name: "Open in JSOM",
      value: "Open in JOSM",
    },
  ];

  const popupAnchor = "model-details";
  return (
    <SkeletonWrapper showSkeleton={!isPending}>
      <div className="h-[90vh] flex flex-col mt-4 mb-20">
        <div className="sticky top-0 z-[10] bg-white">
          <div className="flex items-center justify-between py-3 flex-wrap gap-y-2">
            <div className="flex items-center gap-x-6 z-10">
              <p
                title={data?.name}
                className="text-dark font-semibold text-title-3"
              >
                {data?.name
                  ? truncateString(data?.name, 20)
                  : "Localidad Ama Chuma (Patacamaya)"}
              </p>
              <Popup
                active={showModelDetails}
                anchor={popupAnchor}
                placement="bottom-start"
                distance={10}
              >
                <div className="h-80 border bg-white border-gray-border w-80 shadown-sm shadow-[#433D3D33]  p-5 flex flex-col">
                  <button
                    className="text-dark text-lg self-end"
                    onClick={() => setShowModelDetails(false)}
                    title="Close"
                  >
                    &#x2715;
                  </button>
                  <div>
                    <p className="text-gray"> Model and dataset info here</p>
                  </div>
                </div>
              </Popup>
              <button
                id={popupAnchor}
                className="text-gray flex items-center gap-x-4 text-nowrap"
                onClick={() => setShowModelDetails(!showModelDetails)}
              >
                Model Details <TagsInfoIcon className="icon" />
              </button>
            </div>
            <div className="flex items-center gap-x-6">
              <p className="text-dark text-body-3">
                Map Data - Accepted: 0 Rejected: 0{" "}
              </p>
              <DropDown
                placement="top-end"
                disableCheveronIcon
                dropdownIsOpened={dropdownIsOpened}
                onDropdownHide={onDropdownHide}
                onDropdownShow={onDropdownShow}
                menuItems={downloadButtonDropdownOptions}
                triggerComponent={
                  <ButtonWithIcon
                    disabled={disableButtons}
                    onClick={onDropdownShow}
                    suffixIcon={ChevronDownIcon}
                    label="download"
                    variant="dark"
                    iconClassName={
                      dropdownIsOpened ? "rotate-180 transition-all" : ""
                    }
                  />
                }
              />
            </div>
          </div>
          <Divider />
          <div className="flex justify-between items-center py-3 flex-wrap gap-y-2">
            <div className="flex items-center gap-x-4 justify-between flex-wrap gap-y-2">
              <p>Use JOSM Q</p>
              <Switch
                checked={query[SEARCH_PARAMS.useJOSMQ] as boolean}
                handleSwitchChange={(event) => {
                  updateQuery({
                    [SEARCH_PARAMS.useJOSMQ]: event.target.checked,
                  });
                }}
              />
              <div className="flex justify-between items-center gap-x-3">
                <FormLabel
                  label="Confidence"
                  withTooltip
                  toolTipContent="Text"
                  position="left"
                />
                <Select
                  className="w-40"
                  size={SHOELACE_SIZES.MEDIUM}
                  options={confidenceLevels}
                  defaultValue={query[SEARCH_PARAMS.confidenceLevel] as number}
                  handleChange={(event) => {
                    updateQuery({
                      [SEARCH_PARAMS.confidenceLevel]: Number(
                        event.target.value,
                      ),
                    });
                  }}
                />
              </div>
              <div className="flex justify-between items-center gap-x-3">
                <FormLabel
                  label="Tolerance"
                  withTooltip
                  toolTipContent="Text"
                  position="left"
                />
                <Input
                  className="w-20"
                  size={SHOELACE_SIZES.MEDIUM}
                  value={query[SEARCH_PARAMS.tolerance] as number}
                  labelWithTooltip
                  type={INPUT_TYPES.NUMBER}
                  showBorder
                  handleInput={(event) =>
                    updateQuery({
                      [SEARCH_PARAMS.tolerance]: Number(event.target.value),
                    })
                  }
                />
              </div>
              <div className="flex justify-between  items-center gap-x-3 ">
                <FormLabel
                  label="Area"
                  withTooltip
                  toolTipContent="Text"
                  position="left"
                />
                <Input
                  className="w-20"
                  size={SHOELACE_SIZES.MEDIUM}
                  value={query[SEARCH_PARAMS.area] as number}
                  labelWithTooltip
                  type={INPUT_TYPES.NUMBER}
                  showBorder
                  handleInput={(event) =>
                    updateQuery({
                      [SEARCH_PARAMS.area]: Number(event.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-x-4 w-fit flex-wrap md:flex-nowrap gap-y-2">
              {disableButtons && (
                <p className="text-primary text-sm text-nowrap">
                  {zoomInMessage}
                </p>
              )}
              <Button disabled={disableButtons}>Run Prediction</Button>
            </div>
          </div>
        </div>
        <div className="col-span-12  w-full border-8 border-off-white flex-grow">
          <MapComponent showCurrentZoom drawControl controlsLocation="top-left">
            <MapCursorToolTip
              tooltipPosition={tooltipPosition}
              tooltipVisible={disableButtons && tooltipVisible}
              color="bg-white"
            >
              <p className="text-primary">{zoomInMessage}</p>
            </MapCursorToolTip>
          </MapComponent>
        </div>
      </div>
    </SkeletonWrapper>
  );
};
