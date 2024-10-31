import {
  MODEL_CREATION_FORM_NAME,
  useModelFormContext,
} from "@/app/providers/model-creation-provider";
import { Input } from "@/components/ui/form";
import { SearchIcon } from "@/components/ui/icons";
import CheckIcon from "@/components/ui/icons/check-icon";
import { useState } from "react";

const trainingDatasetList = [
  {
    name: "Training Dataset 1",
    id: 1,
    value: "Training Dataset 1",
  },
  {
    name: "Training Dataset 2",
    id: 2,
    value: "Training Dataset 2",
  },
  {
    name: "Training Dataset 3",
    id: 3,
    value: "Training Dataset 3",
  },
  {
    name: "Training Dataset 4",
    id: 4,
    value: "Training Dataset 4",
  },
  {
    name: "Training Dataset 5",
    id: 5,
    value: "Training Dataset 5",
  },
];
const SelectExistingTrainingDatasetForm = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { formData, handleChange } = useModelFormContext();

  return (
    <div className="flex flex-col gap-y-10">
      <p className="font-semibold text-body-1 mb-2">
        Existing Training Dataset
      </p>
      <div className={`flex  items-center border border-gray-border`}>
        <SearchIcon className={`ml-2 icon-lg text-dark`} />
        <Input
          handleInput={(e) => {
            setSearchQuery(e.target.value);
          }}
          value={searchQuery}
          placeholder="Search"
        />
      </div>
      <div className="border border-light-gray rounded-sm h-80 p-2  flex flex-col gap-y-4 overflow-scroll">
        {trainingDatasetList
          .filter((td) => td.value.includes(searchQuery))
          .map((td, id) => (
            <div
              key={`training-dataset-${id}`}
              className="cursor-pointer hover:bg-off-white p-2 flex items-center justify-between"
              onClick={() =>
                handleChange(
                  MODEL_CREATION_FORM_NAME.SELECTED_TRAINING_DATASET_ID,
                  String(td.id),
                )
              }
            >
              <p>{td.name}</p>
              {formData.selectedTrainingDatasetId === String(td.id) && (
                <span className="icon rounded-full p-1 bg-green-primary flex items-center justify-center">
                  <CheckIcon className=" text-white" />
                </span>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default SelectExistingTrainingDatasetForm;
