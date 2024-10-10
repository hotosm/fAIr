
import { Button } from "@/components/ui/button"
import Input from "@/components/ui/form/input/input"


type DateRangePickerProps = {
    startDate: string
    endDate: string
    onStartDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    onEndDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    onClear: () => void
    onApply: (event: React.ChangeEvent<HTMLButtonElement>) => void
}


const DateRangePicker: React.FC<DateRangePickerProps> = (
    { startDate, endDate, onClear, onApply, onStartDateChange, onEndDateChange }
) => {



    return (
        <div className="flex flex-col gap-y-7 bg-white">
            {/* Native date pickers */}
            <div className="flex items-center gap-x-4">
                <Input type='date' showBorder label='From:' handleInput={onStartDateChange} value={startDate} />
                <Input type='date' showBorder label='To:' handleInput={onEndDateChange} value={endDate} />
            </div>

            {/* Only show when there is at least an input in either of the dates */}
            {
                (startDate || endDate) &&
                <div className="flex self-end items-center gap-x-3">
                    <Button variant="default" size="medium" onClick={onClear} >
                        Clear
                    </Button>
                    <Button variant="tertiary" size="medium" onClick={onApply} >
                        Apply
                    </Button>
                </div>
            }
        </div>
    )
}

export default DateRangePicker;