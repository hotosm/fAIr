import { Input } from "@/components/ui/form";
import { SearchIcon } from "@/components/ui/icons";
import { useState } from "react";

const trainingDatasetList = [
  {
    name: "Training Dataset 1",
    value: "Training Dataset 1",
  },
  {
    name: "Training Dataset 2",
    value: "Training Dataset 2",
  },
  {
    name: "Training Dataset 3",
    value: "Training Dataset 3",
  },
  {
    name: "Training Dataset 4",
    value: "Training Dataset 4",
  },
  {
    name: "Training Dataset 5",
    value: "Training Dataset 5",
  },
  {
    name: "Training Dataset 6",
    value: "Training Dataset 6",
  },
  {
    name: "Training Dataset 7",
    value: "Training Dataset 7",
  },
  {
    name: "Training Dataset 8",
    value: "Training Dataset 8",
  },
];
const SelectExistingTrainingDatasetForm = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");

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
              className="cursor-pointer hover:bg-off-white p-2"
            >
              <p>{td.name}</p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default SelectExistingTrainingDatasetForm;
