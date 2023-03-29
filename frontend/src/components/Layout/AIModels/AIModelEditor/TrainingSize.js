import React, { useEffect } from "react";
import { useMutation } from "react-query";
import axios from "../../../../axios";

const TrainingSize = (props) => {
  // const { accessToken,authenticate } = useContext(AuthContext);
  console.log(props);

  const getTrainingSize = async () => {
    // if (!accessToken) return;
    console.log(
      `/workspace/dataset_${props.datasetId}/output/training_${props.trainingId}/preprocessed`
    );

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
  const { mutate, data, isLoading } = useMutation(getTrainingSize);

  useEffect(() => {
    mutate();

    return () => {};
  }, [mutate]);

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
