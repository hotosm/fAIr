import React, { useState } from "react";
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Collapse,
  Box,
  Button,
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
  length,
  size,
  path,
  isFile,
  downloadUrl,
  onDirClick,
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    if (!isFile) {
      setOpen(!open);
      setIsLoading(true);
      onDirClick(`${path}/`);
      setIsLoading(false);
    } else {
      window.open(`${downloadUrl}${path}`, "_blank");
    }
  };
  const formatFileSize = (sizeInBytes) => {
    const units = ["bytes", "KB", "MB", "GB", "TB"];

    let formattedSize = sizeInBytes;
    let unitIndex = 0;

    while (formattedSize > 1024 && unitIndex < units.length - 1) {
      formattedSize /= 1024;
      unitIndex++;
    }

    return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
  };

  const renderContent = () => {
    if (isFile) return null;

    const dirContent = Object.entries(content.dir || {}).map(([key, value]) => {
      return (
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
      );
    });

    const fileContent = Object.entries(content.file || {}).map(
      ([key, value]) => (
        <FileStructure
          key={key}
          name={key}
          size={value["size"]}
          length={value["len"]}
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
    <Box borderRadius="5px" padding="8px">
      <ListItem
        Button
        onClick={handleClick}
        style={{
          paddingLeft: isFile ? "32px" : "16px",
          color: "white",
          background: "#FABFBF",
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
          secondary={`${size ? formatFileSize(size) : ""} ${
            length ? `${length} file` : ""
          }`}
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
