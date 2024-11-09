import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DeleteIcon, FileIcon, UploadIcon } from "@/components/ui/icons";
import { DialogProps, Feature, FeatureCollection, Geometry } from "@/types";
import {
  MAX_TRAINING_AREA_UPLOAD_FILE_SIZE,
  showErrorToast,
  showSuccessToast,
  snapGeoJSONGeometryToClosestTile,
  TOAST_NOTIFICATIONS,
  truncateString,
  validateGeoJSONArea,
} from "@/utils";
import { SlFormatBytes } from "@shoelace-style/shoelace/dist/react";
import { useCallback, useState } from "react";
import { FileWithPath, useDropzone } from "react-dropzone";
import { useCreateTrainingArea } from "@/features/model-creation/hooks/use-training-areas";
import { geojsonToWKT } from "@terraformer/wkt";
import useDevice from "@/hooks/use-device";

type FileUploadDialogProps = DialogProps & {
  datasetId: string;
  offset: number;
};

interface AcceptedFile {
  file: FileWithPath;
  id: string;
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  isOpened,
  closeDialog,
  datasetId,
  offset,
}) => {
  const [acceptedFiles, setAcceptedFiles] = useState<AcceptedFile[]>([]);
  const createTrainingArea = useCreateTrainingArea({
    datasetId: Number(datasetId),
    offset: offset,
  });

  const onDrop = useCallback((files: FileWithPath[]) => {
    const validFiles = files.filter((file) => {
      if (file.size > MAX_TRAINING_AREA_UPLOAD_FILE_SIZE) {
        showErrorToast(undefined, `File ${file.name} is too large (max 5MB)`);
        return false;
      }
      if (!file.name.endsWith(".geojson") && !file.name.endsWith(".json")) {
        showErrorToast(
          undefined,
          `File ${file.name} is not a supported format`,
        );
        return false;
      }
      return true;
    });

    const newFiles = validFiles.map((file) => ({
      file,
      id: generateUniqueId(),
    }));
    setAcceptedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const clearAcceptedFiles = () => {
    setAcceptedFiles([]);
  };

  const generateUniqueId = () => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".geojson", ".json"],
    },
    disabled: createTrainingArea.isPending,
  });

  const deleteFile = (fileId: string) => {
    setAcceptedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const resetState = () => {
    clearAcceptedFiles();
    closeDialog();
  };
  const handleUpload = async () => {
    const promises = acceptedFiles.map((file: AcceptedFile) => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const geojson: FeatureCollection | Feature = JSON.parse(
              event.target?.result as string,
            );
            if (validateGeoJSONArea(geojson)) {
              showErrorToast(
                undefined,
                `Skipping upload for ${file.file.name} because the area is too large.`,
              );
              resolve();
              return;
            }
            let geometries: Geometry[] = [];
            if (geojson.type === "FeatureCollection") {
              geometries = geojson.features.map((feature) => feature.geometry);
            } else if (geojson.type === "Feature") {
              geometries = [geojson.geometry];
            } else {
              throw new Error("Invalid GeoJSON format");
            }
            for (const geometry of geometries) {
              snapGeoJSONGeometryToClosestTile(geometry);
              const wkt = geojsonToWKT(geometry);
              await createTrainingArea.mutateAsync({
                dataset: datasetId,
                geom: `SRID=4326;${wkt}`,
              });
            }
            resolve();
          } catch (error) {
            showErrorToast(
              undefined,
              `Error processing file: ${file.file.name}`,
            );
            reject(error);
          }
        };

        reader.onerror = (error) => {
          showErrorToast(undefined, `File read error for ${file.file.name}`);

          reject(error);
        };

        reader.readAsText(file.file);
      });
    });

    try {
      await Promise.all(promises);
      showSuccessToast(TOAST_NOTIFICATIONS.trainingAreasFileUploadSuccess);
      resetState();
    } catch (error) {
      showErrorToast(error);
    }
  };

  const files = acceptedFiles.map((file) => (
    <li
      key={file.id}
      className="border-2 border-gray-border rounded-lg px-3.5 py-1 flex items-center text-gray justify-between w-full"
    >
      <div className="flex items-center gap-x-2">
        <FileIcon className="icon" />
        <div>
          <p className="text-dark">{truncateString(file.file.name)}</p>
          <SlFormatBytes value={file.file.size} className="text-sm" />
        </div>
      </div>
      <button
        className="bg-secondary p-2 w-8 h-8 flex items-center justify-center rounded-lg"
        onClick={() => deleteFile(file.id)}
      >
        <DeleteIcon className="icon text-primary" />
      </button>
    </li>
  ));
  const isMobile = useDevice();
  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={resetState}
      label="Upload Training Area(s)"
      preventClose={createTrainingArea.isPending}
      size={isMobile ? "extra-large" : "medium"}
    >
      <div className="flex flex-col gap-y-4">
        <div
          className="h-80 border-2 border-gray border-dashed w-full flex items-center justify-center flex-col gap-y-4 text-gray rounded-lg"
          {...getRootProps()}
        >
          <UploadIcon className="icon-lg w-10 h-10 " />
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <>
              <p>Drag 'n' drop some files here, or click to select files</p>
              <small>Supports only GeoJSON (.geojson) files. (5MB max.)</small>
            </>
          )}
        </div>
        <small>{acceptedFiles.length} files selected</small>
        <ul className="flex flex-col gap-y-2 overflow-y-auto max-h-40">
          {files}
        </ul>
        <div className="self-end">
          <Button
            disabled={
              acceptedFiles.length === 0 || createTrainingArea.isPending
            }
            onClick={handleUpload}
          >
            Upload
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default FileUploadDialog;
