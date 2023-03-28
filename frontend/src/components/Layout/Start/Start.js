import React, { useContext } from "react";
import { Route, Routes } from "react-router-dom";
import AuthContext from "../../../Context/AuthContext";
import ModelsMap from "./ModelsMap/ModelsMap";
import Prediction from "./Prediction/Prediction";

const Start = (props) => {
  const { accessToken } = useContext(AuthContext);

  return (
    <>
      {accessToken && (
        <Routes>
          <Route
            path="/:id"
            name="Start Mapping"
            element={<Prediction></Prediction>}
          />
          <Route path="/" name="List " element={<ModelsMap></ModelsMap>} />
        </Routes>
      )}

      {!accessToken && (
        <div style={{ height: "600px", width: "100%" }}>
          <img
            alt=" arrow"
            src="/red-arrow-up-corner-right-clip-art-30.png"
            style={{
              height: "100px",
              width: "100px",
              float: "right",
              marginRight: "35px",
            }}
          ></img>
        </div>
      )}
    </>
  );
};

export default Start;
