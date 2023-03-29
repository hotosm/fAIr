import React from "react";
import { useQuery } from "react-query";
import axios from "../../../../axios";

const TrainingSize = (props) => {
  console.log("inside trainingsize");
  console.log(props);

  // const { accessToken,authenticate } = useContext(AuthContext);

  const getTrainingSize = async () => {
    console.log(
      `/workspace/dataset_${props.datasetId}/output/training_${props.trainingId}/preprocessed/`
    );
    // if (!accessToken) return;
    try {
      const res = await axios.get(
        `/workspace/dataset_${props.datasetId}/output/training_${props.trainingId}/preprocessed/`
      );

      if (res.error) {
        // setMapError(res.error.response.statusText);
      } else {
        console.log("TrainingSize ", res.data);
        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
    } finally {
    }
  };
  const { data, isLoading } = useQuery("getTrainingSize", getTrainingSize, {
    refetchInterval: 120000,
  });
  return (
    <>
      {isLoading && "Loading ..."}
      {data && data.dir && data.dir.chips && (
        <>
          {Array.isArray(data.dir.chips) && data.dir.chips.length > 0 ? (
            data.dir.chips.map((chip, index) => (
              <div key={index}>
                <span>Chip {index + 1}: </span>
                <span>{chip.len} images</span>
              </div>
            ))
          ) : (
            <span>No chips found</span>
          )}
        </>
      )}
    </>
  );
};

export default TrainingSize;
