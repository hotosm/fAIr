import React, { useEffect } from "react";
import { useMutation } from "react-query";
import axios from "../../../../axios";
const TrainingMap = (props) => {
  const getDataset = async () => {
    try {
      const res = await axios.get(`/dataset/${props.datasetId}`);

      if (res.error) {
        console.log(
          res.error.response.statusText +
            " / " +
            JSON.stringify(res.error.response.data)
        );
        return;
      }
      return res.data;
    } catch (e) {
      console.log("isError");
    } finally {
    }
  };
  const { mutate, data, isLoading } = useMutation(getDataset);

  useEffect(() => {
    mutate();

    return () => {};
  }, [mutate]);

  return (
    <>
      {data && (
        <p>
          Id : {data.id}, {data.name}
        </p>
      )}
    </>
  );
};

export default TrainingMap;
