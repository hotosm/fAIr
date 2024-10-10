import { Dialog } from "@/components/ui/dialog"
import { DirectoryTree } from "@/components/ui/directory-tree"
import { useDevice } from "@/hooks/use-device"

type TrainingAreaDialogProps = {
    isOpened: boolean
    setOpen: () => void
}

const ModelFilesDialog: React.FC<TrainingAreaDialogProps> = ({ isOpened, setOpen }) => {
    const isMobile = useDevice();
    return (
        <Dialog isOpened={isOpened} setOpen={setOpen} label={'Model Files'} size={isMobile ? 'large' : 'medium'}>
            <DirectoryTree />
        </Dialog>
    )
}

export default ModelFilesDialog