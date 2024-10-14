import { Dialog } from "@/components/ui/dialog"
import { DirectoryTree } from "@/components/ui/directory-tree"
import { useDevice } from "@/hooks/use-device"


type TrainingAreaDialogProps = {
    isOpened: boolean
    setOpen: () => void
    trainingId: number
    datasetId: number
}

const ModelFilesDialog: React.FC<TrainingAreaDialogProps> = ({ isOpened, setOpen, datasetId, trainingId }) => {
    const isMobile = useDevice();
    return (
        <Dialog isOpened={isOpened} setOpen={setOpen} label={'Model Files'} size={isMobile ? 'large' : 'medium'}>
            <DirectoryTree trainingId={trainingId} datasetId={datasetId} />
        </Dialog>
    )
}

export default ModelFilesDialog