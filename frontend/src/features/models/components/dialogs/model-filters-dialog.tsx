import { Dialog } from "@/components/ui/dialog"
import { useDevice } from "@/hooks/use-device"
import { OrderingFilter } from "../filters"
import { TQueryParams } from "@/types"


type TrainingAreaDialogProps = {
    isOpened: boolean
    setOpen: () => void
    updateQuery: (updatedParams: TQueryParams) => void
    query: TQueryParams

}

const ModelFiltersDialog: React.FC<TrainingAreaDialogProps> = ({ isOpened, setOpen, query, updateQuery }) => {
    const isMobile = useDevice();
    return (
        <Dialog isOpened={isOpened} setOpen={setOpen} label={'Filter'} size={isMobile ? 'extra-large' : 'medium'}>
            <OrderingFilter query={query} updateQuery={updateQuery} />
        </Dialog>
    )
}

export default ModelFiltersDialog