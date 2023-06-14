import React from "react";
import { useQuery } from "react-query";
import axios from "../../../../axios";

const DatasetCurrent = (props) => {
  // const { accessToken,authenticate } = useContext(AuthContext);

  const getDatasetSepcs = async () => {
    // if (!accessToken) return;
    try {
      const res = await axios.get(`/workspace/dataset_${props.datasetId}/`);

      if (res.error) {
        // setMapError(res.error.response.statusText);
      } else {
        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
    } finally {
    }
  };
  const { data, isLoading } = useQuery("getDatasetSepcs", getDatasetSepcs, {
    refetchInterval: 120000,
  });
  return (
    <>
      {isLoading && "Loading ..."}
      {data && data.dir && data.dir.input && (
        <span>{data.dir.input.len - 1} images</span>
      )}
    </>
  );
};

export default DatasetCurrent;
