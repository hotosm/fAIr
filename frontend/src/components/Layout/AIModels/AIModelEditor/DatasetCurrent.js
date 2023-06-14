import React, { useEffect } from "react";
import { useQuery } from "react-query";
import axios from "../../../../axios";

const DatasetCurrent = (props) => {
  // const { accessToken,authenticate } = useContext(AuthContext);

  const getDatasetSepcs = async () => {
    // if (!accessToken) return;
    try {
      const res = await axios.get(`/workspace/dataset_${props.datasetId}/`);
      console.log(`/workspace/dataset_${props.datasetId}/`, res);
      if (res.error) {
        console.log("isError", res.error);
      } else {
        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
    } finally {
    }
  };
  const { data, isLoading } = useQuery(
    "getDatasetSepcs" + props.datasetId,
    getDatasetSepcs,
    {
      refetchInterval: 30000,
    }
  );
  useEffect(() => {
    return () => {};
  }, []);

  return (
    <>
      {isLoading && "Loading ..."}
      {data && data.dir && data.dir.input && (
        <span>{data.dir.input.len - 1} images</span>
      )}
      {data === undefined && <span>Not downloaded yet</span>}
    </>
  );
};

export default DatasetCurrent;
