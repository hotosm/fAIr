import { Head } from "@/components/seo";
import { PageHeader } from "@/features/models/components/";
import { DatasetExplorer } from "@/components/shared/dataset-explorer";

export const DatasetExplorerPage = () => {
    return (
        <>
            <Head title="Explore Datasets" />
            <section className="my-10 min-h-screen">
                <PageHeader
                    title="fAIr Training Datasets"
                    description={
                        'A training dataset consists of high-resolution aerial imagery used as the base layer for fine-tuning an AI model.'
                    }
                    disableCreateButton
                    isTrainingDataset
                />
                <DatasetExplorer disableSelectedDatasetText disableInstruction />
            </section>
        </>
    );
};
