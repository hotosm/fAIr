import { TModel } from "@/types"
import FairModelPlaceholderImage from '@/assets/fair_model_placeholder_image.png'
import { Image } from "@/components/ui/image"
import { extractDatePart } from "@/utils"


type ModelCardProps = {
    model: TModel
}

const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
    return (
        <div className="max-w-[299px] min-h-[471px] flex flex-col border border-gray-border">
            <div className="h-[200px]">
                <Image src={FairModelPlaceholderImage} alt={model.name} />
            </div>
            <div className="p-5 flex flex-col gap-y-6">
                <div className="inline-flex flex-col gap-y-2">
                    <p className="font-medium text-body-1 text-black">{model.name}</p>
                    <p className="text-gray text-body-2">ID: <span>{model.id}</span></p>
                </div>
                {/* accuracy */}
                <div>
                    <p className="text-gray text-body-3">Accuracy:</p>
                    <p className="text-dark font-semibold text-body-2">{model.accuracy ?? 0}</p>
                </div>
                {/* Name and date */}
                <div className="inline-flex flex-col gap-y-2">
                    <p className="font-semibold text-body-2base text-dark">{model.created_by.username}</p>
                    <p className="text-gray text-body-3">Last Modified: <span className="font-bold">{extractDatePart(model.last_modified)}</span></p>
                </div>
            </div>
        </div>
    )
}

export default ModelCard