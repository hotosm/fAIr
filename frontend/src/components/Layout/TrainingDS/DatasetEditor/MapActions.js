import React, { useContext, useState } from "react";
import axios from "../../../../axios";
import { useMutation } from "react-query";

import { useParams } from "react-router-dom";
import AuthContext from "../../../../Context/AuthContext";

const MapActions = (props) => {
  const [error, setError] = useState(false);
  const { id: datasetId } = useParams();
  const [selectedZooms, setSelectedZooms] = useState([]);
  const { accessToken } = useContext(AuthContext);
  const downloadDS = async () => {
    try {
      const body = {
        dataset_id: datasetId,
        source: props.oamImagery.url,
        zoom_level: selectedZooms,
      };
      console.log("body", body);
      setError(false);
      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.post("/dataset/image/build/", body, { headers });

      console.log(res);
      if (res.error) {
        setError(res.error.response.data.Error);
        return;
      }

      return res.data;
    } catch (e) {
      console.log("isError");
      setError(e);
    } finally {
    }
  };

  const { mutate, data, isLoading } = useMutation(downloadDS);

  return (
    <>
      {/* { JSON.stringify(props.oamImagery) } */}
      {/* <br/> */}
      {/* <p>{JSON.stringify(selectedZooms)}</p> */}
    </>
  );
};
export default MapActions;
