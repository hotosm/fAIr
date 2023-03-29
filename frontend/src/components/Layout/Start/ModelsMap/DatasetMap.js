import React, { useEffect } from "react";
import { useMutation } from "react-query";
import axios from "../../../../axios";
const DatasetMap = (props) => {
  const getTraining = async () => {
    try {
      const res = await axios.get(`/training/${props.trainingId}`);

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
  const { mutate, data, isLoading } = useMutation(getTraining);

  useEffect(() => {
    mutate();

    return () => {};
  }, [mutate]);

  return (
    <>
      {data && (
        <p>
          Id : {data.id}, {data.description} Accuracy : {data.accuracy}
        </p>
      )}
    </>
  );
};

export default DatasetMap;
