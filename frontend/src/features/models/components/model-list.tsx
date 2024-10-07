import { TModel } from "@/types"
import ModelCard from "./model-card"
import { LayoutView } from "@/app/routes/models"

type ModelListProps = {
    models?: TModel[]
    layout?: LayoutView
}


const ModelList: React.FC<ModelListProps> = ({ models }) => {
    return (
        <>
            {
                models?.map((model, id) => <ModelCard key={`model-${id}`} model={model} />)
            }
            {/* Tabular View */}
        </>
    )
}

export default ModelList;