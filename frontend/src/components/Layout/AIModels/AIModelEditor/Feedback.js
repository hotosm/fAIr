import { IconButton, Tooltip } from "@mui/material";
import React, { useContext } from "react";
import InfoIcon from "@mui/icons-material/Info";
import FeedbackIcon from "@mui/icons-material/Feedback";
import { useQuery } from "react-query";
import axios from "../../../../axios";
import AuthContext from "../../../../Context/AuthContext";
import FindReplaceIcon from "@mui/icons-material/FindReplace";
const Feedback = ({ trainingId }) => {
  const { accessToken } = useContext(AuthContext);
  const getFeedback = async () => {
    try {
      const headers = {
        "access-token": accessToken,
      };
      const res = await axios.get(`/feedback/?training=${trainingId}`, null, {
        headers,
      });

      if (res.error) {
      } else {
        // console.log(`/feedback/?training=${trainingId}`, res.data);
        return res.data;
      }
    } catch (e) {
      console.log("isError", e);
    } finally {
    }
  };
  const { data: feedbackData, isLoading } = useQuery(
    "getFeedback" + trainingId,
    getFeedback,
    {
      refetchInterval: 10000,
    }
  );

  return (
    <>
      {feedbackData &&
        feedbackData.features &&
        feedbackData.features.length > 0 && (
          <Tooltip
            title={`Total number of feedback on this training is ${feedbackData.features.length}`}
            placement="left"
          >
            <IconButton aria-label="popup">
              <FeedbackIcon size="small" />
            </IconButton>
          </Tooltip>
        )}
      {isLoading && (
        <IconButton aria-label="popup">
          <FindReplaceIcon size="small" />
        </IconButton>
      )}
    </>
  );
};
export default Feedback;
