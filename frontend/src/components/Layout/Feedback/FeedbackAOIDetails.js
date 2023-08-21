import { Typography } from "@material-ui/core";
import React from "react";
import { useQuery } from "react-query";

import axios from "../../../axios";

import { timeSince, aoiStatusText } from "../../../utils";
const FeedbackAOIDetails = (props) => {
  // console.log("rendering AOIDetails",props)
  const fetchAOI = async () => {
    try {
      const res = await axios.get(`/feedback-aoi/${props.id}/`);

      if (res.error) {
        // setMapError(res.error.response.statusText);
        console.log(res.error.response.statusText);
      } else {
        // success full fetch
        // console.log("API details, ",props.aoiId,res.data);
        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
    } finally {
    }
  };
  const { data } = useQuery("fetchAOI" + props.id, fetchAOI, {
    refetchInterval: 5000,
  });

  return (
    <>
      {data && (
        <Typography
          key={props.id}
          component={"span"}
          variant="caption"
          display="block"
          gutterBottom
        >
          {aoiStatusText(data.properties.label_status)}{" "}
          {data.properties.label_fetched &&
            timeSince(new Date(data.properties.label_fetched), new Date())}
        </Typography>
      )}
    </>
  );
};

export default FeedbackAOIDetails;
