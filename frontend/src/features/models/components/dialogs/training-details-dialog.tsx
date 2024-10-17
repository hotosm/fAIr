import { Dialog } from "@/components/ui/dialog"
import { useDevice } from "@/hooks/use-device"


type TrainingDetailsDialogProps = {
    isOpened: boolean
    setOpen: () => void
    trainingId: number
}

const TrainingDetailsDialog: React.FC<TrainingDetailsDialogProps> = ({ isOpened, setOpen, trainingId }) => {
    const isMobile = useDevice();
    return (
        <Dialog isOpened={isOpened} setOpen={setOpen} label={`Training ${trainingId}`} size={isMobile ? 'extra-large' : 'large'}>
            <div className={`${!isMobile ? 'h-[600px]' : 'h-[350px]'}`}>
                details here ...
            </div>
        </Dialog>
    )
}

export default TrainingDetailsDialog;