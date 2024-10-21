import { Button } from "@/components/ui/button";
import Input from "@/components/ui/form/input/input";

type DateRangePickerProps = {
  startDate: string;
  endDate: string;
  onStartDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEndDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onApply: (event: React.ChangeEvent<HTMLButtonElement>) => void;
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
        className={`w-full flex items-center ${isMobileFilterModal ? "flex-col gap-y-4" : "flex-row gap-x-4 "}`}
      >
        <Input
          type="date"
          showBorder
          label="From:"
          handleInput={onStartDateChange}
          value={startDate}
          className="w-full"
        />
        <Input
          type="date"
          showBorder
          label="To:"
          handleInput={onEndDateChange}
          value={endDate}
          className="w-full"
        />
      </div>

      {/* Only show when there is at least an input in either of the dates */}
      {(startDate || endDate) && (
        <div
          className={`flex ${!isMobileFilterModal && "self-end"} items-center gap-x-3`}
        >
          <Button variant="default" size="medium" onClick={onClear}>
            Clear
          </Button>
          <Button variant="tertiary" size="medium" onClick={onApply}>
            Apply
          </Button>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
