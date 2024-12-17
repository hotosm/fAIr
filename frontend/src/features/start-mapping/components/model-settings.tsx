import { SEARCH_PARAMS, TQueryParams } from "@/app/routes/start-mapping";
import { ButtonWithIcon } from "@/components/ui/button";
import { DropDown } from "@/components/ui/dropdown";
import { FormLabel, Input, Select, Switch } from "@/components/ui/form";
import { ChevronDownIcon } from "@/components/ui/icons";
import { startMappingPageContent } from "@/constants";
import { INPUT_TYPES, SHOELACE_SIZES } from "@/enums";
import { useDropdownMenu } from "@/hooks/use-dropdown-menu";

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

const ModelSettings = ({
  query,
  updateQuery,
}: {
  query: TQueryParams;
  updateQuery: (newParams: TQueryParams) => void;
}) => {
  const {
    onDropdownHide: onModelSettingsDropdownHide,
    onDropdownShow: onModelSettingsDropdownShow,
    dropdownIsOpened,
  } = useDropdownMenu();

  const handleQueryUpdate = (key: string, val: number | boolean) => {
    // Keep the dropdown opened when making changes
    onModelSettingsDropdownShow();
    updateQuery({
      [key]: val,
    });
  };

  return (
    <DropDown
      placement="top-end"
      disableCheveronIcon
      dropdownIsOpened={dropdownIsOpened}
      onDropdownHide={onModelSettingsDropdownHide}
      onDropdownShow={onModelSettingsDropdownShow}
      triggerComponent={
        <ButtonWithIcon
          onClick={
            dropdownIsOpened
              ? onModelSettingsDropdownShow
              : onModelSettingsDropdownHide
          }
          suffixIcon={ChevronDownIcon}
          label={"Settings"}
          uppercase={false}
          size={SHOELACE_SIZES.MEDIUM}
          variant="secondary"
        />
      }
    >
      <div className="flex flex-col bg-white p-3 justify-between rounded-md flex-wrap gap-y-4 w-60">
        <div className="flex gap-x-2 justify-between">
          <FormLabel
            label={startMappingPageContent.settings.useJOSMQ.label}
            withTooltip
            toolTipContent={
              startMappingPageContent.settings.useJOSMQ.tooltip
            }
            position="left"
          />
          <Switch
            checked={query[SEARCH_PARAMS.useJOSMQ] as boolean}
            handleSwitchChange={(event) => {
              handleQueryUpdate(SEARCH_PARAMS.useJOSMQ, event.target.checked);
            }}
          />
        </div>
        <div className="flex justify-between items-center gap-x-2">
          <FormLabel
            label={startMappingPageContent.settings.confidence.label}
            withTooltip
            toolTipContent={
              startMappingPageContent.settings.confidence.tooltip
            }
            position="left"
          />
          <Select
            className="w-[90px]"
            size={SHOELACE_SIZES.SMALL}
            options={confidenceLevels}
            defaultValue={query[SEARCH_PARAMS.confidenceLevel] as number}
            handleChange={(event) => {
              handleQueryUpdate(
                SEARCH_PARAMS.confidenceLevel,
                Number(event.target.value),
              );
            }}
          />
        </div>
        <div className="flex justify-between items-center gap-x-2">
          <FormLabel
            label={startMappingPageContent.settings.tolerance.label}
            withTooltip
            toolTipContent={
              startMappingPageContent.settings.tolerance.tooltip
            }
            position="left"
          />
          <Input
            className="w-16"
            size={SHOELACE_SIZES.SMALL}
            value={query[SEARCH_PARAMS.tolerance] as number}
            labelWithTooltip
            type={INPUT_TYPES.NUMBER}
            showBorder
            handleInput={(event) =>
              handleQueryUpdate(
                SEARCH_PARAMS.tolerance,
                Number(event.target.value),
              )
            }
            min={0}
            step={0.1}
          />
        </div>
        <div className="flex justify-between  items-center gap-x-2">
          <FormLabel
            label={startMappingPageContent.settings.area.label}
            withTooltip
            toolTipContent={
              startMappingPageContent.settings.area.tooltip
            }
            position="left"
          />
          <Input
            className="w-16"
            size={SHOELACE_SIZES.SMALL}
            value={query[SEARCH_PARAMS.area] as number}
            labelWithTooltip
            type={INPUT_TYPES.NUMBER}
            showBorder
            handleInput={(event) =>
              handleQueryUpdate(SEARCH_PARAMS.area, Number(event.target.value))
            }
            min={0}
          />
        </div>
      </div>
    </DropDown>
  );
};

export default ModelSettings;
