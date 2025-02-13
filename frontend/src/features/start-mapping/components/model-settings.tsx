import { DropDown } from '@/components/ui/dropdown';
import {
  FormLabel,
  Input,
  Select,
  Switch
} from '@/components/ui/form';
import { SEARCH_PARAMS, TQueryParams } from '@/app/routes/start-mapping';
import { SettingsIcon } from '@/components/ui/icons';
import { ToolTip } from '@/components/ui/tooltip';
import { useDropdownMenu } from '@/hooks/use-dropdown-menu';
import {
  ELEMENT_DISTANCE_FROM_NAVBAR,
  START_MAPPING_PAGE_CONTENT,
} from "@/constants";
import {
  DropdownPlacement,
  INPUT_TYPES,
  SHOELACE_SELECT_SIZES,
  SHOELACE_SIZES,
} from "@/enums";

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

export const ModelSettings = ({
  query,
  updateQuery,
  isMobile = false,
}: {
  query: TQueryParams;
  updateQuery: (newParams: TQueryParams) => void;
  isMobile?: boolean;
}) => {
  const {
    onDropdownHide: onModelSettingsDropdownHide,
    onDropdownShow: onModelSettingsDropdownShow,
    dropdownIsOpened,
    toggleDropDown,
  } = useDropdownMenu();

  const handleQueryUpdate = (key: string, val: number | boolean) => {
    // Keep the dropdown opened when making changes
    onModelSettingsDropdownShow();
    updateQuery({
      [key]: val,
    });
  };

  const modelSettings = (
    <div className="flex flex-col bg-white p-3 justify-between rounded-xl flex-wrap gap-y-4">
      <div className="flex gap-x-2 justify-between">
        <FormLabel
          label={START_MAPPING_PAGE_CONTENT.settings.useJOSMQ.label}
          withTooltip
          toolTipContent={START_MAPPING_PAGE_CONTENT.settings.useJOSMQ.tooltip}
          position="left"
        />
        <Switch
          checked={query[SEARCH_PARAMS.useJOSMQ] as boolean}
          handleSwitchChange={(event) => {
            handleQueryUpdate(SEARCH_PARAMS.useJOSMQ, event.target.checked);
          }}
        />
      </div>
      <div className="flex justify-between items-center gap-x-4">
        <FormLabel
          label={START_MAPPING_PAGE_CONTENT.settings.confidence.label}
          withTooltip
          toolTipContent={
            START_MAPPING_PAGE_CONTENT.settings.confidence.tooltip
          }
          position="left"
        />
        <Select
          className="w-[80px]"
          size={SHOELACE_SELECT_SIZES.SMALL}
          options={confidenceLevels}
          defaultValue={query[SEARCH_PARAMS.confidenceLevel] as number}
          handleChange={(value) => {

            handleQueryUpdate(SEARCH_PARAMS.confidenceLevel, Number(value));
          }}
        />
      </div>
      <div className="flex justify-between items-center gap-x-2">
        <FormLabel
          label={START_MAPPING_PAGE_CONTENT.settings.tolerance.label}
          withTooltip
          toolTipContent={START_MAPPING_PAGE_CONTENT.settings.tolerance.tooltip}
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
          label={START_MAPPING_PAGE_CONTENT.settings.area.label}
          withTooltip
          toolTipContent={START_MAPPING_PAGE_CONTENT.settings.area.tooltip}
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
  );

  if (!isMobile) {
    return (
      <DropDown
        placement={DropdownPlacement.TOP_END}
        distance={ELEMENT_DISTANCE_FROM_NAVBAR}
        disableCheveronIcon
        dropdownIsOpened={dropdownIsOpened}
        onDropdownHide={onModelSettingsDropdownHide}
        onDropdownShow={onModelSettingsDropdownShow}
        triggerComponent={
          <ToolTip content={START_MAPPING_PAGE_CONTENT.settings.tooltip}>
            <button
              className={`p-1.5 flex items-center hover:icon-interaction ${dropdownIsOpened && "icon-interaction"}`}
              onClick={toggleDropDown}
            >
              <SettingsIcon className="icon md:icon-lg text-dark" />
            </button>
          </ToolTip>
        }
        className="rounded-xl"
      >
        {modelSettings}
      </DropDown>
    );
  }
  return modelSettings;
};
