
import { IconButton } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { DirectoryIcon, ExternalLinkIcon, MapIcon, RequestIcon } from "@/components/ui/icons";
import ChevronDownIcon from "@/components/ui/icons/chevron-down";
import { ModelProperties } from "@/features/models/components";
import { TrainingAreaDialog, ModelFilesDialog } from "@/features/models/components/dialogs";
import ModelFeedbacks from "@/features/models/components/model-feedbacks";
import { ModelDetailsSkeleton } from "@/features/models/components/skeletons";
import { useModelDetails } from "@/features/models/hooks/use-models";
import { useDialog } from "@/hooks/use-dialog";
import { APPLICATION_ROUTES, formatDate } from "@/utils";
import { useEffect, } from "react";
import { useNavigate, useParams } from "react-router-dom";




const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <section className="flex flex-col gap-y-8">
        <h1 className="font-semibold text-dark md:text-title-2">{title}</h1>
        {children}
    </section>
);




const DetailItem = ({ label, value }: { label: string, value?: string }) => (
    <p className="text-dark text-body-2">
        <span className="text-gray">{label}: </span>{value}
    </p>
);




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
        return (
            <ModelDetailsSkeleton />
        )
    }


    return (
        <>
            <ModelFilesDialog
                setOpen={toggleModelFilesDialog}
                isOpened={isModelFilesDialogOpened}
                trainingId={data?.published_training as number}
                datasetId={data?.dataset as number}
            />
            <TrainingAreaDialog
                isOpened={isOpened}
                setOpen={toggle}
            />
            <div className="my-12 flex flex-col gap-y-20">
                <section className="flex flex-col gap-y-8">
                    <div className="flex flex-col gap-y-4">
                        <div className="flex flex-col">
                            <div className="inline-flex flex-col gap-y-2">
                                <p className="text-gray text-body-2">Model ID: {data?.id}</p>
                                <div className="flex items-center justify-between">
                                    <h1 className="font-semibold text-dark md:text-large-title">{data?.name}</h1>
                                    <IconButton label="Start mapping"
                                        variant="primary"
                                        size="medium"
                                        capitalizeText={false}
                                        prefixIcon={MapIcon}
                                    />
                                </div>
                            </div>
                            <p className="max-w-[50%] text-gray text-body-2">
                                {data?.description ?? 'Model description is not available.'}
                            </p>
                        </div>
                        <div className="self-end flex items-center gap-x-2 cursor-pointer text-primary text-body-2 font-semibold" onClick={toggle}>
                            <p>View Training Area</p>
                            <ChevronDownIcon className="w-4 h-4 -rotate-90" />
                        </div>
                    </div>
                    <Divider />
                    <div className="grid grid-cols-3">

                        <div className="flex flex-col gap-y-4">
                            <DetailItem label="Created by" value={data?.user.username} />
                            <DetailItem label="Created on" value={formatDate(data?.created_at as string)} />
                            <DetailItem label="Last Modified" value={formatDate(data?.last_modified as string)} />
                        </div>
                        <div className="col-span-1 items-start justify-between flex flex-col gap-y-4">
                            <p className="text-dark text-body-2">
                                <span className="text-gray">Training Data: </span>
                                Training_{data?.published_training}
                            </p>
                            <IconButton label="Model Files"
                                variant="outline" size="medium"
                                capitalizeText={false}
                                onClick={toggleModelFilesDialog}
                                prefixIcon={DirectoryIcon}
                                suffixIcon={ExternalLinkIcon}
                            />
                        </div>

                        <div className="col-span-1 flex flex-col items-end justify-between gap-y-4">
                            <ModelFeedbacks trainingId={data?.published_training as number} />
                        </div>
                    </div>
                </section>
                <Section title="Properties">
                    <ModelProperties
                        trainingId={data?.published_training as number}
                        thumbnailURL={data?.thumbnail_url}
                    />
                </Section>
                <Section title="Training History">
                    <div className="flex self-end">
                        <IconButton
                            label="submit a training request"
                            variant="dark"
                            size="medium"
                            prefixIcon={RequestIcon}
                        />
                    </div>
                    <div className="flex items-center justify-center border h-[200px] w-full">
                        Table
                    </div>
                </Section>
            </div>
        </>
    );

}



