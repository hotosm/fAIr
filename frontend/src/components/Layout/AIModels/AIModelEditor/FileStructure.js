import React, { useState } from "react";
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Collapse,
  Box,
} from "@mui/material";
import {
  Folder,
  InsertDriveFile,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";

const FileStructure = ({
  name,
  content,
  lenght,
  size,
  path,
  isFile,
  downloadUrl,
  onDirClick,
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    console.log("button clicked ");
    if (!isFile) {
      setOpen(!open);
      setIsLoading(true);
      onDirClick(`${path}/`);
      setIsLoading(false);
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
        length={value["len"]}
        size={value["size"]}
        content={value}
        path={`${path}${key}/`}
        isFile={false}
        downloadUrl={downloadUrl}
        onDirClick={onDirClick}
      />
    ));

    const fileContent = Object.entries(content.file || {}).map(
      ([key, value]) => (
        <FileStructure
          key={key}
          name={key}
          size={value["size"]}
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
    color: "white",
  };

  return (
    <Box bgcolor="#f5f5f5" borderRadius="5px" padding="8px">
      <ListItem
        button
        onClick={handleClick}
        style={{
          paddingLeft: isFile ? "32px" : "16px",
          color: "white",
          background: "white",
        }}
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
          secondary={`${size ? `${Math.round(size / 1024)} kb` : ""}`}
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
        {isLoading ? (
          <CircularProgress size={20} style={{ margin: "16px" }} />
        ) : (
          renderContent()
        )}
      </Collapse>
    </Box>
  );
};

export default FileStructure;
