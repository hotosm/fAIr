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
        fAIr is an open AI-assisted mapping service developed by the
        Humanitarian OpenStreetMap Team (HOT) that aims to improve the
        efficiency and accuracy of mapping efforts for humanitarian purposes.
        The service uses AI models, specifically computer vision techniques, to
        detect objects such as buildings, roads, waterways, and trees from
        satellite and UAV imagery. The name fAIr is derived from the following
        terms:
        <br />
        <br />
        <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
          <li>f: for freedom and free and open-source software</li>
          <li>AI: for Artificial Intelligence</li>
          <li>
            r: for resilience and our responsibility for our communities and the
            role we play within humanitarian mapping
          </li>
        </ul>
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
          Start Creating Dataset
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
