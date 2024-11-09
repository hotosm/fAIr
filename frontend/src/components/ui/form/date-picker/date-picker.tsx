import { Button } from "@/components/ui/button";
import Input from "@/components/ui/form/input/input";
import { INPUT_TYPES, SHOELACE_SIZES } from "@/enums";
import { cn } from "@/utils";

type DateRangePickerProps = {
  startDate: string;
  endDate: string;
  onStartDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEndDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onApply: () => void;
  isMobileFilterModal?: boolean;
};

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onClear,
  onApply,
  onStartDateChange,
  onEndDateChange,
  isMobileFilterModal,
}) => {
  return (
    <div className="flex flex-col gap-y-7 w-full">
      {/* Native date pickers */}
      <div
        className={cn(
          `w-full flex items-center ${isMobileFilterModal ? "flex-col gap-y-4" : "flex-row gap-x-4 "}`,
        )}
      >
        <Input
          type={INPUT_TYPES.DATE}
          showBorder
          label="From:"
          handleInput={onStartDateChange}
          value={startDate}
          className="w-full"
          size={SHOELACE_SIZES.MEDIUM}
        />
        <Input
          type={INPUT_TYPES.DATE}
          showBorder
          label="To:"
          handleInput={onEndDateChange}
          value={endDate}
          className="w-full"
          size={SHOELACE_SIZES.MEDIUM}
        />
      </div>

      {/* Only show when there is at least an input in either of the dates */}
      {(startDate || endDate) && (
        <div
          className={cn(
            `flex ${!isMobileFilterModal && "self-end"} items-center gap-x-3`,
          )}
        >
          <Button
            variant="default"
            size={SHOELACE_SIZES.MEDIUM}
            onClick={onClear}
          >
            Clear
          </Button>

          <Button
            variant="tertiary"
            size={SHOELACE_SIZES.MEDIUM}
            onClick={onApply}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
