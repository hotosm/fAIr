import useDebounce from '@/hooks/use-debounce';
import { CheckIcon } from '@/components/ui/icons';
import { HelpText, Input } from '@/components/ui/form';
import { MODELS_CONTENT } from '@/constants';
import { SearchIcon } from '@/components/ui/icons';
import { SkeletonWrapper } from '@/components/ui/skeleton';
import { useGetTrainingDatasets } from '@/features/model-creation/hooks/use-training-datasets';
import { useState } from 'react';
import {
  MODEL_CREATION_FORM_NAME,
  useModelsContext,
} from "@/app/providers/models-provider";

const SelectExistingTrainingDatasetForm = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { formData, handleChange } = useModelsContext();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data, isPending, isError } =
    useGetTrainingDatasets(debouncedSearchQuery);

  return (
    <div className="flex flex-col gap-y-10">
      <div>
        <p className="font-semibold text-body-2 md:text-body-1 mb-2">
          {
            MODELS_CONTENT.modelCreation.trainingDataset.form
              .existingTrainingDatasetSectionHeading
          }
        </p>
        <HelpText content={MODELS_CONTENT.modelCreation.trainingDataset.form
          .existingTrainingDatasetSectionDescription} />
      </div>
      <div className={`flex  items-center border border-gray-border`}>
        <SearchIcon className={`ml-2 icon-lg text-dark`} />
        <Input
          handleInput={(e) => {
            setSearchQuery(e.target.value);
          }}
          value={searchQuery}
          placeholder={
            MODELS_CONTENT.modelCreation.trainingDataset.form.searchBar
              .placeholder
          }
          disabled={isError}
          className="w-full"

        />
      </div>

      <div
        className={`border border-light-gray rounded-sm h-80 p-2  flex flex-col gap-y-4 overflow-scroll ${isError && "items-center justify-center"}`}
      >
        {isError ? (
          <p className="text-center">Failed to retrieve training datasets.</p>
        ) : (
          <SkeletonWrapper showSkeleton={isPending} skeletonClassName="h-80">
            <ul className="flex gap-y-2 flex-col">
              {data &&
                data
                  .filter((td) =>
                    td.name.toLowerCase().includes(searchQuery.toLowerCase()),
                  )
                  .map((td, id) => (
                    <li
                      key={`training-dataset-${id}`}
                      className={`cursor-pointer hover:bg-off-white p-2 flex items-center justify-between ${formData.selectedTrainingDatasetId === String(td.id) && "bg-off-white"}`}
                    >
                      <button
                        disabled={!td.source_imagery}
                        className="w-full text-start"
                        onClick={() => {

                          handleChange(
                            MODEL_CREATION_FORM_NAME.SELECTED_TRAINING_DATASET_ID,
                            String(td.id),
                          );
                          // Also update other parameters
                          handleChange(
                            MODEL_CREATION_FORM_NAME.TMS_URL,
                            String(td.source_imagery),
                          );

                          handleChange(
                            MODEL_CREATION_FORM_NAME.DATASET_NAME,
                            String(td.name),
                          );
                        }}
                      >
                        <p className="flex flex-col">
                          {td.name}{" "}
                          {!td.source_imagery && (
                            <small className="italic">(Invalid TMS URL)</small>
                          )}
                          <small>ID: {td.id}</small>
                        </p>
                      </button>
                      {formData.selectedTrainingDatasetId === String(td.id) && (
                        <span className="icon rounded-full p-1 bg-green-primary flex items-center justify-center">
                          <CheckIcon className=" text-white" />
                        </span>
                      )}
                    </li>
                  ))}
            </ul>
          </SkeletonWrapper>
        )}
      </div>
    </div>
  );
};

export default SelectExistingTrainingDatasetForm;
