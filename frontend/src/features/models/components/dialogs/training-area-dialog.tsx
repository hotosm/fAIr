import { Dialog } from "@/components/ui/dialog"
import { useDevice } from "@/hooks/use-device"
import { MapComponent } from "@/features/models/components/map"


type TrainingAreaDialogProps = {
    isOpened: boolean
    setOpen: () => void
}

const TrainingAreaDialog: React.FC<TrainingAreaDialogProps> = ({ isOpened, setOpen }) => {
    const isMobile = useDevice();

    return (
        <Dialog isOpened={isOpened} setOpen={setOpen} label={'Training Area'} size={isMobile ? 'extra-large' : 'large'}>
            <div className={`${!isMobile ? 'h-[600px]' : 'h-[350px]'}`}>
                <div className="h-full w-full">
                    <MapComponent onMapLoad={() => undefined} />
                </div>
            </div>
        </Dialog>
    )
}

export default TrainingAreaDialog