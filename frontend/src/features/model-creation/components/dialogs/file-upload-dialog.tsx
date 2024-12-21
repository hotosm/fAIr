import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DeleteIcon, FileIcon, UploadIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner"; // Ensure Spinner is correctly imported
import { DialogProps, Feature, FeatureCollection, Geometry } from "@/types";
import {
  formatAreaInAppropriateUnit,
  MAX_TRAINING_AREA_UPLOAD_FILE_SIZE,
  MODEL_CREATION_CONTENT,
  showErrorToast,
  showSuccessToast,
  truncateString,
  validateGeoJSONArea,
} from "@/utils";
import { SlFormatBytes } from "@shoelace-style/shoelace/dist/react";
import { useCallback, useMemo, useState } from "react";
import { FileWithPath, useDropzone } from "react-dropzone";

type FileUploadDialogProps = DialogProps & {
  label: string;
  fileUploadHandler: (geometry: Geometry) => Promise<void>;
  successToast: string;
  disabled: boolean;
  disableFileSizeValidation?: boolean;
};

interface AcceptedFile {
  file: FileWithPath;
  id: string;
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  isOpened,
  closeDialog,
  label,
  fileUploadHandler,
  successToast,
  disabled,
  disableFileSizeValidation = false,
}) => {
  const [acceptedFiles, setAcceptedFiles] = useState<AcceptedFile[]>([]);
  const [uploadInProgress, setUploadInProgress] = useState<boolean>(false);

  const onDrop = useCallback(
    (files: FileWithPath[]) => {
      const initialValidFiles = files.filter((file) => {
        if (!file.name.endsWith(".geojson") && !file.name.endsWith(".json")) {
          showErrorToast(
            undefined,
            `File ${file.name} is not a supported format`,
          );
          return false;
        }
        if (file.size > MAX_TRAINING_AREA_UPLOAD_FILE_SIZE) {
          showErrorToast(
            undefined,
            `File ${file.name} is too large (max ${formatAreaInAppropriateUnit(MAX_TRAINING_AREA_UPLOAD_FILE_SIZE)})`,
          );
          return false;
        }
        return true;
      });

      const validateFiles = async () => {
        const validFiles: AcceptedFile[] = [];

        for (const file of initialValidFiles) {
          try {
            const text = await file.text();
            const geojson: FeatureCollection | Feature = JSON.parse(text);
            if (
              !disableFileSizeValidation &&
              validateGeoJSONArea(geojson as Feature)
            ) {
              showErrorToast(
                undefined,
                `File area for ${file.name} exceeds area limit.`,
              );
            } else {
              validFiles.push({ file, id: generateUniqueId() });
            }
          } catch (error) {
            showErrorToast(undefined, `Invalid JSON format in ${file.name}.`);
          }
        }

        setAcceptedFiles((prev) => [...prev, ...validFiles]);
      };

      validateFiles();
    },
    [disableFileSizeValidation],
  );

  const generateUniqueId = () => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".geojson", ".json"],
    },
    disabled: disabled || uploadInProgress,
  });

  const deleteFile = (fileId: string) => {
    setAcceptedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const resetState = () => {
    setAcceptedFiles([]);
    setUploadInProgress(false);
    closeDialog();
  };

  const handleUpload = async () => {
    setUploadInProgress(true);

    try {
      // Collect all geometries from all accepted files
      const allGeometries: Geometry[] = [];

      for (const file of acceptedFiles) {
        try {
          const text = await file.file.text();
          const geojson: FeatureCollection | Feature = JSON.parse(text);

          // Validate GeoJSON area if required
          if (
            !disableFileSizeValidation &&
            validateGeoJSONArea(geojson as Feature)
          ) {
            showErrorToast(
              undefined,
              `File area for ${file.file.name} exceeds area limit.`,
            );
            continue; // Skip this file
          }

          // Extract geometries based on GeoJSON type
          if (geojson.type === "FeatureCollection") {
            allGeometries.push(
              ...geojson.features.map((feature) => feature.geometry),
            );
          } else if (geojson.type === "Feature") {
            allGeometries.push(geojson.geometry);
          } else {
            throw new Error("Invalid GeoJSON format");
          }
        } catch (error: any) {
          showErrorToast(undefined, `Error processing file: ${file.file.name}`);
          // Optionally, you can choose to continue or reject the entire upload
          // Here, we'll continue to process other files
        }
      }

      if (allGeometries.length === 0) {
        showErrorToast(undefined, "No valid geometries found to upload.");
        setUploadInProgress(false);
        return;
      }

      // Create an array of upload promises for all geometries
      const uploadPromises = allGeometries.map((geometry) =>
        fileUploadHandler(geometry),
      );

      // Await all upload promises
      await Promise.all(uploadPromises);

      // If all uploads succeed
      showSuccessToast(successToast);
      resetState();
    } catch (error: any) {
      // If any upload fails
      const errorMessage = error.message || "An error occurred during upload.";
      showErrorToast(undefined, errorMessage);
    } finally {
      setUploadInProgress(false);
    }
  };

  const files = useMemo(() => {
    return acceptedFiles.map((file) => {
      return (
        <li
          key={file.id}
          className="border-2 border-gray-border rounded-lg px-3.5 py-1 text-gray w-full"
        >
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <span className="border-2 border-gray-border p-1 flex items-center">
                  <FileIcon className="icon " />
                </span>
                <div>
                  <p className="text-dark text-body-3">
                    {truncateString(file.file.name)}
                  </p>
                  <SlFormatBytes value={file.file.size} className="text-sm" />
                </div>
              </div>
              <button
                className="bg-secondary p-2 w-8 h-8 flex items-center justify-center rounded-lg"
                onClick={() => deleteFile(file.id)}
                disabled={disabled || uploadInProgress}
              >
                <DeleteIcon className="icon text-primary" />
              </button>
            </div>
            {/* Removed ProgressBar */}
          </div>
        </li>
      );
    });
  }, [acceptedFiles, disabled, uploadInProgress]);

  return (
    <Dialog
      isOpened={isOpened}
      closeDialog={resetState}
      label={label}
      preventClose={disabled || uploadInProgress}
    >
      <div className="flex flex-col gap-y-4">
        <div
          className="h-80 border-2 border-gray border-dashed w-full flex items-center justify-center flex-col gap-y-4 text-gray rounded-lg"
          {...getRootProps()}
        >
          <UploadIcon className="icon-lg w-10 h-10 " />
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-body-4 md:text-body-3 text-center">
              Drop the files here ...
            </p>
          ) : (
            <>
              <p className="text-body-4 md:text-body-3 text-center">
                {
                  MODEL_CREATION_CONTENT.trainingArea.fileUploadDialog
                    .mainInstruction
                }
              </p>
              <small className="text-body-4 md:text-body-3 text-center">
                {
                  MODEL_CREATION_CONTENT.trainingArea.fileUploadDialog
                    .fleSizeInstruction
                }
              </small>
              {!disableFileSizeValidation && (
                <small className="text-body-4 md:text-body-3 text-center">
                  {
                    MODEL_CREATION_CONTENT.trainingArea.fileUploadDialog
                      .aoiAreaInstruction
                  }
                </small>
              )}
            </>
          )}
        </div>
        <small>{acceptedFiles.length} file(s) selected</small>
        <ul className="flex flex-col gap-y-2 overflow-y-auto max-h-40">
          {files}
        </ul>
        <div className="self-end">
          <Button
            disabled={
              acceptedFiles.length === 0 || disabled || uploadInProgress
            }
            onClick={handleUpload}
            className="flex items-center gap-x-2"
          >
            {uploadInProgress ? (
              <>
                Uploading
                <Spinner />
              </>
            ) : (
              MODEL_CREATION_CONTENT.trainingArea.form.upload
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default FileUploadDialog;
