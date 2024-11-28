import { SEARCH_PARAMS, TQueryParams } from "@/app/routes/start-mapping";
import { FormLabel, Input, Select, Switch } from "@/components/ui/form";
import { APPLICATION_CONTENTS } from "@/contents";
import { INPUT_TYPES, SHOELACE_SIZES } from "@/enums";

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
  return (
    <div className="flex items-center gap-x-2 justify-between flex-wrap gap-y-4">
      <div className="flex gap-x-2">
        <FormLabel
          label={APPLICATION_CONTENTS.START_MAPPING.settings.useJOSMQ.label}
          withTooltip
          toolTipContent={
            APPLICATION_CONTENTS.START_MAPPING.settings.useJOSMQ.tooltip
          }
          position="left"
        />
        <Switch
          checked={query[SEARCH_PARAMS.useJOSMQ] as boolean}
          handleSwitchChange={(event) => {
            updateQuery({
              [SEARCH_PARAMS.useJOSMQ]: event.target.checked,
            });
          }}
        />
      </div>
      <div className="flex justify-between items-center gap-x-2">
        <FormLabel
          label={APPLICATION_CONTENTS.START_MAPPING.settings.confidence.label}
          withTooltip
          toolTipContent={
            APPLICATION_CONTENTS.START_MAPPING.settings.confidence.tooltip
          }
          position="left"
        />
        <Select
          className="w-[90px]"
          size={SHOELACE_SIZES.SMALL}
          options={confidenceLevels}
          defaultValue={query[SEARCH_PARAMS.confidenceLevel] as number}
          handleChange={(event) => {
            updateQuery({
              [SEARCH_PARAMS.confidenceLevel]: Number(event.target.value),
            });
          }}
        />
      </div>
      <div className="flex justify-between items-center gap-x-2">
        <FormLabel
          label={APPLICATION_CONTENTS.START_MAPPING.settings.tolerance.label}
          withTooltip
          toolTipContent={
            APPLICATION_CONTENTS.START_MAPPING.settings.tolerance.tooltip
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
            updateQuery({
              [SEARCH_PARAMS.tolerance]: Number(event.target.value),
            })
          }
          min={0}
          step={0.1}
        />
      </div>
      <div className="flex justify-between  items-center gap-x-2">
        <FormLabel
          label={APPLICATION_CONTENTS.START_MAPPING.settings.area.label}
          withTooltip
          toolTipContent={
            APPLICATION_CONTENTS.START_MAPPING.settings.area.tooltip
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
            updateQuery({
              [SEARCH_PARAMS.area]: Number(event.target.value),
            })
          }
          min={0}
        />
      </div>
    </div>
  );
};

export default ModelSettings;
