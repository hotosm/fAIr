import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@mui/material/Button";
import { Tooltip } from "@mui/material";
const MapActions = () => {
  const { id: datasetId } = useParams();
  const navigate = useNavigate();

  const handleListModelsClick = () => {
    const DEFAULT_FILTER = {
      items: [
        {
          columnField: "dataset",
          id: 28949,
          operatorValue: "equals",
          value: datasetId,
        },
      ],
      linkOperator: "and",
      quickFilterValues: [],
      quickFilterLogicOperator: "and",
    };
    localStorage.setItem("modelFilter", JSON.stringify(DEFAULT_FILTER));
    navigate("/ai-models");
  };

  return (
    <>
      <Tooltip title="View associated models with this training dataset">
        <Button
          variant="contained"
          color="primary"
          onClick={handleListModelsClick}
        >
          View Models
        </Button>
      </Tooltip>
    </>
  );
};

export default MapActions;
