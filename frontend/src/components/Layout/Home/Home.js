import React from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

const GetStarted = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: "#FFFFFF",
        padding: "50px",
        textAlign: "center",
      }}
    >
      <Typography
        variant="h3"
        component="h1"
        style={{ color: "#E53E3E", fontWeight: "bold", marginBottom: "30px" }}
      >
        Welcome to fAIr
      </Typography>
      <Typography
        variant="body1"
        style={{ color: "#3D3D3D", fontSize: "18px", marginBottom: "50px" }}
      >
        fAIr performs mapping in the same way as human mappers using HOT's Tasking Manager. It looks at UAV imagery and produces map data that can be added to OpenStreetMap (OSM). Tests show a 100% speedup compared to manual mapping. It uses Artificial Intelligence (AI) to accomplish this.
        <br />
        <br />
        fAIr is developed by the Humanitarian OpenStreetMap Team (HOT) and all the software is free and open source.
        <br />
        <br />
        Before fAIr is used, it needs to be fine-tuned by training on high quality map data for a small representative part of the geographical region where it is to be used.
      </Typography>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          sx={{ marginRight: "30px" }}
          onClick={() => navigate("/training-datasets")}
        >
          Try Demo
        </Button>
        <Button
          variant="contained"
          color="secondary"
          component={Link}
          to="/learn"
        >
          Tutorial
        </Button>
      </div>
    </div>
  );
};

export default GetStarted;
