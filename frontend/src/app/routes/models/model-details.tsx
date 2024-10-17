import { Head } from "@/components/seo";
import { ButtonWithIcon } from "@/components/ui/button";
import { RequestIcon } from "@/components/ui/icons";
import { ModelDetailsSection, ModelDetailsProperties, ModelDetailsInfo, TrainingHistoryTable, } from "@/features/models/components";
import { TrainingAreaDialog, ModelFilesDialog } from "@/features/models/components/dialogs";
import { ModelDetailsSkeleton } from "@/features/models/components/skeletons";
import { useModelDetails } from "@/features/models/hooks/use-models";
import { useDialog } from "@/hooks/use-dialog";
import { APPLICATION_ROUTES, } from "@/utils";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";




export const ModelDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const { isOpened, toggle } = useDialog();
    const { isOpened: isModelFilesDialogOpened, toggle: toggleModelFilesDialog } = useDialog();
    const navigate = useNavigate();
    const { data, isPending, isError, error } = useModelDetails(id as string);

    useEffect(() => {
        if (isError) {
            navigate(APPLICATION_ROUTES.NOTFOUND, {
                //@ts-expect-error
                state: { from: window.location.pathname, error: error?.response?.data?.detail },
            });
        }
    }, [isError, error, navigate]);

    if (isPending) {
        return <ModelDetailsSkeleton />;
    }

    return (
        <>
            <Head title={`${data?.name} Model`} />
            <ModelFilesDialog
                setOpen={toggleModelFilesDialog}
                isOpened={isModelFilesDialogOpened}
                trainingId={data?.published_training as number}
                datasetId={data?.dataset as number}
            />
            <TrainingAreaDialog isOpened={isOpened} setOpen={toggle} />
            <div className="my-12 flex flex-col gap-y-20">
                <ModelDetailsInfo data={data} toggleModelFilesDialog={toggleModelFilesDialog} toggleTrainingAreaDialog={toggle} />
                <ModelDetailsSection title="Properties">
                    <ModelDetailsProperties
                        trainingId={data?.published_training as number}
                        thumbnailURL={data?.thumbnail_url}
                    />
                </ModelDetailsSection>
                <div className="flex md:hidden">
                    <ButtonWithIcon
                        label="Submit a training request"
                        variant="dark"
                        size="medium"
                        prefixIcon={RequestIcon}
                    />
                </div>
                <ModelDetailsSection title="Training History">
                    <div className="md:flex self-end hidden">
                        <ButtonWithIcon
                            label="Submit a training request"
                            variant="dark"
                            size="medium"
                            prefixIcon={RequestIcon}
                        />
                    </div>
                    <TrainingHistoryTable modelId={data?.id as string} trainingId={data?.published_training as number} modelOwner={data?.user.username as string} />
                </ModelDetailsSection>
            </div>
        </>
    );
};
