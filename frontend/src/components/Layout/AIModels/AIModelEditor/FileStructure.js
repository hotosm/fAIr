import React, { useState } from "react";
import { ListItem, ListItemIcon, ListItemText, Collapse } from "@mui/material";
import {
  Folder,
  InsertDriveFile,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";

const FileStructure = ({ name, content, path, isFile, downloadUrl }) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    console.log("button clicked ");
    if (!isFile) {
      setOpen(!open);
    } else {
      window.open(`${downloadUrl}${path}`, "_blank");
    }
  };

  const renderContent = () => {
    if (isFile) return null;

    const dirContent = Object.entries(content.dir || {}).map(([key, value]) => (
      <FileStructure
        key={key}
        name={key}
        content={value}
        path={`${path}${key}/`}
        isFile={false}
        downloadUrl={downloadUrl}
      />
    ));

    const fileContent = Object.entries(content.file || {}).map(
      ([key, value]) => (
        <FileStructure
          key={key}
          name={key}
          content={value}
          path={`${path}${key}`}
          isFile={true}
          downloadUrl={downloadUrl}
        />
      )
    );

    return [...dirContent, ...fileContent];
  };

  const iconStyles = {
    minWidth: "32px",
    color: "#757575",
  };

  const listItemTextStyles = {
    fontSize: "0.875rem",
  };

  return (
    <>
      <ListItem
        button
        onClick={handleClick}
        style={{ paddingLeft: isFile ? "32px" : "16px" }}
      >
        <ListItemIcon style={iconStyles}>
          {isFile ? (
            <InsertDriveFile fontSize="small" />
          ) : (
            <Folder fontSize="small" />
          )}
        </ListItemIcon>
        <ListItemText
          primary={name}
          primaryTypographyProps={{ style: listItemTextStyles }}
        />
        {!isFile &&
          (open ? (
            <ExpandLess fontSize="small" />
          ) : (
            <ExpandMore fontSize="small" />
          ))}
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {renderContent()}
      </Collapse>
    </>
  );
};

export default FileStructure;
