import React, { useEffect } from "react";
import { useMutation } from "react-query";
import axios from "../../axios";
const OSMUser = (props) => {
  const getUser = async () => {
    try {
      const headers = {
        "Content-Type": "application/xml; charset=utf-8",
      };
      // console.log("get OSM user data ")

      const res = await axios.get(
        "https://api.openstreetmap.org/api/0.6/user/" + props.uid,
        { headers }
      );

      if (res.error) {
        console.log(
          res.error.response.statusText +
            " / " +
            JSON.stringify(res.error.response.data)
        );
        return;
      }

      // console.log("OSM user data", res);

      return res.data;
    } catch (e) {
      console.log("isError");
    } finally {
    }
  };
  const { mutate, data, isLoading } = useMutation(getUser);

  useEffect(() => {
    mutate();

    return () => {};
  }, [mutate]);

  return (
    <>
      {data && (
        <a
          target={"_blank"}
          rel={"noreferrer"}
          href={"https://www.openstreetmap.org/user/" + data.user.display_name}
        >
          {" "}
          {data.user.display_name}
        </a>
      )}
      {!data && (
        <a
          target={"_blank"}
          rel={"noreferrer"}
          href={"https://api.openstreetmap.org/api/0.6/user/" + props.uid}
        >
          {" "}
          {props.uid}
        </a>
      )}
    </>
  );
};

export default OSMUser;
