import { Alert, LinearProgress, Stack } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { useMutation } from "react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import RefreshTwoTone from "@mui/icons-material/RefreshTwoTone";
import axios from "../../axios";
import AuthContext from "../../Context/AuthContext";
const Authenticate = (props) => {
  const { authenticate } = useContext(AuthContext);
  const [error, setError] = useState(false);
  let location = useLocation();
  const navigate = useNavigate();

  const callback = async () => {
    try {
      // const params = `?${location.search.split("&")[1]}&${location.search.split("&")[2]}`
      const params = location.search;
      console.log("calling auth/callback");
      const res = await axios.get(`/auth/callback/${params}`);

      if (!res)
        setError(
          "OSM Authentication API is not avialble, please contact HOT tech team tech@hotosm.org"
        );
      console.log("res", res);
      if (res.error) setError("Error");

      authenticate(res.data.access_token);

      navigate(
        `${
          localStorage.getItem("redirect")
            ? localStorage.getItem("redirect")
            : "/"
        }`
      );
      return res.data;
    } catch (e) {
      console.log("isError");
      setError("Error");
    } finally {
    }
  };
  const { mutate, isLoading } = useMutation(callback);

  useEffect(() => {
    // console.log(location)
    mutate();
    return () => {};
  }, []);

  return (
    <>
      {isLoading && (
        <Stack sx={{ width: "100%", color: "grey.500" }} spacing={2}>
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
        </Stack>
      )}
      {error && (
        <p>
          <Alert severity="error">
            Please press refresh button{" "}
            <RefreshTwoTone color="error"></RefreshTwoTone> in you browser if
            you see this error <br></br>
          </Alert>
        </p>
      )}
    </>
  );
};

export default Authenticate;
