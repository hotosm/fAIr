import React from "react";
import { useQuery } from "react-query";
import axios from "../../../../axios";

const TrainingSize = (props) => {
  // const { accessToken,authenticate } = useContext(AuthContext);

  const getTrainingSize = async () => {
    // if (!accessToken) return;
    try {
      const res = await axios.get(
        `/workspace/dataset_${props.datasetId}/output/training_${props.trainingId}/preprocessed`
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
        <span>{data.dir.chips.len} images</span>
      )}
    </>
  );
};

export default TrainingSize;
