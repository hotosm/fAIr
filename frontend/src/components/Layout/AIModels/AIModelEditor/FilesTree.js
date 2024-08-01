import React, { useEffect, useState } from "react";
import { SimpleTreeView } from "@mui/x-tree-view";
import TreeItem from "@mui/lab/TreeItem";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import axios from "../../../../axios";
import { formatFileSize } from "../../../../utils";
import FolderIcon from "@mui/icons-material/Folder";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { Button, LinearProgress, Stack } from "@mui/material";
const FilesTree = (props) => {
  const [root, setRoot] = useState("");
  const [currentList, setCurrentList] = useState(null);
  const [dirHistory, setDirHistory] = useState([]);
  const [loadingStrcture, setLoadingStrcture] = useState(false);
  const getFileStructure = async () => {
    try {
      setLoadingStrcture(true);
      let path = "";
      dirHistory.forEach((o) => (path = path + "/" + o));
      console.log("calling for ", path);
      const res = await axios.get(
        `/workspace/${props.trainingWorkspaceURL}${path}`
      );
      if (res.error) {
        console.error(res.error);
      } else {
        setCurrentList(res.data);
        setLoadingStrcture(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStrcture(false);
    }
  };
  useEffect(() => {
    console.log(
      "Object.entries(content.dir || {}).map(([key, value])",
      Object.entries(props.content || {})
    );
    getFileStructure();
    return () => {};
  }, [dirHistory]);

  let path = "";
  dirHistory.forEach((o) => (path = path + "/" + o));
  return (
    <>
      {/* <p>id {props.trainingId}</p>
      <p>content {JSON.stringify(props.content, 2)}</p>
      <p>trainingWorkspaceURL is {props.trainingWorkspaceURL}</p> */}
      <p>
        <b>Currently showing content:</b> /training_{props.trainingId}
        {path}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Button
          onClick={(e) => {
            const newHistory = [...dirHistory];
            newHistory.pop();
            setDirHistory(newHistory);
          }}
          disabled={dirHistory.length === 0}
          style={{ color: "white", fontSize: "0.875rem" }}
        >
          Go Back
        </Button>
      </div>
      {loadingStrcture && (
        <Stack sx={{ width: "100%", color: "grey.500" }} spacing={2}>
          <LinearProgress color="hot" />
          <LinearProgress color="hot" />
        </Stack>
      )}
      <SimpleTreeView
        aria-label="file system navigator"
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ExpandLessIcon />}
        sx={{ height: 240, flexGrow: 1, overflowY: "auto" }}
      >
        {currentList &&
          !loadingStrcture &&
          Object.entries(currentList.file || {}).map((obj, idx) => {
            let path = "";
            dirHistory.forEach((o) => (path = path + "/" + o));
            return (
              <TreeItem
                key={idx}
                nodeId={"nodefile" + idx}
                icon={<FileDownloadIcon color="hot" />}
                label={
                  <p>
                    <a href={`${props.downloadUrl}${path}/${obj[0]}`} download>
                      {obj[0]}
                    </a>{" "}
                    - {formatFileSize(obj[1].size)}{" "}
                  </p>
                }
              ></TreeItem>
            );
          })}
        {currentList &&
          !loadingStrcture &&
          Object.entries(currentList.dir || {}).map((obj, idx) => {
            return (
              <TreeItem
                key={idx}
                nodeId={"nodedir" + idx}
                icon={<FolderIcon color="hot" />}
                label={
                  <p>
                    {" "}
                    {obj[0]} {formatFileSize(obj[1].size)}
                  </p>
                }
                onClick={(e) => {
                  console.log("onClick", e);
                  setDirHistory([...dirHistory, obj[0]]);
                }}
              >
                {/* <TreeItem nodeId="2" label="Calendar" /> */}
              </TreeItem>
            );
          })}
        {/* <TreeItem key={key} nodeId="1" label="Applications">
              <TreeItem nodeId="2" label="Calendar" />
            </TreeItem> */}
      </SimpleTreeView>
    </>
  );
};

export default FilesTree;
