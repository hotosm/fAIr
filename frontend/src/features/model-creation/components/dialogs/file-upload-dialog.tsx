import { Button } from "@/components/ui/button";
import { DeleteIcon, FileIcon, UploadIcon } from "@/components/ui/icons";
import { Dialog } from "@/components/ui/dialog";
import { DialogProps, Feature, FeatureCollection } from "@/types";
import { FileWithPath, useDropzone } from "react-dropzone";
import { Geometry, MultiPolygon, Polygon } from "geojson";
import { SlFormatBytes } from "@shoelace-style/shoelace/dist/react";
import { Spinner } from "@/components/ui/spinner";
import { useCallback, useState } from "react";
import {
  MAX_ACCEPTABLE_POLYGON_IN_TRAINING_AREA_GEOJSON_FILE,
  MAX_GEOJSON_FILE_UPLOAD_FOR_TRAINING_AREA_LABELS,
  MAX_GEOJSON_FILE_UPLOAD_FOR_TRAINING_AREAS,
  MAX_TRAINING_AREA_SIZE,
  MAX_TRAINING_AREA_UPLOAD_FILE_SIZE,
  MIN_TRAINING_AREA_SIZE,
  MODELS_CONTENT,
} from "@/constants";
import {
  formatAreaInAppropriateUnit,
  showErrorToast,
  showSuccessToast,
  truncateString,
  validateGeoJSONArea,
} from "@/utils";

type FileUploadDialogProps = DialogProps & {
  label: string;
  fileUploadHandler?: (fileGeometry: Polygon) => Promise<void>;
  successToast?: string;
  disabled: boolean;
  disableFileSizeValidation?: boolean;
  isAOILabelsUpload?: boolean;
  rawFileUploadHandler?: (formData: FormData) => Promise<void>;
};

const isPolygonGeometry = (
  geometry: Geometry,
): geometry is Polygon | MultiPolygon => {
  return geometry.type === "Polygon" || geometry.type === "MultiPolygon";
};

type AcceptedFile = {
  file: FileWithPath;
  id: string;
};

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  isOpened,
  closeDialog,
  label,
  fileUploadHandler,
  successToast,
  disabled,
  disableFileSizeValidation = false,
  // AOI labels are uploaded as raw GeoJSON file
  isAOILabelsUpload = false,
  rawFileUploadHandler,
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
            if (geojson.type === "FeatureCollection") {
              if (!isAOILabelsUpload) {
                // Validate the number of features in the collection.
                if (
                  geojson.features.length >
                  MAX_ACCEPTABLE_POLYGON_IN_TRAINING_AREA_GEOJSON_FILE
                ) {
                  showErrorToast(
                    undefined,
                    `File ${file.name} exceeds limit of ${MAX_ACCEPTABLE_POLYGON_IN_TRAINING_AREA_GEOJSON_FILE} polygon features.`,
                  );
                  continue;
                }
              }
              validFiles.push({ file, id: generateUniqueId() });
            } else if (
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
    maxFiles: isAOILabelsUpload
      ? MAX_GEOJSON_FILE_UPLOAD_FOR_TRAINING_AREA_LABELS
      : MAX_GEOJSON_FILE_UPLOAD_FOR_TRAINING_AREAS,
    disabled:
      disabled ||
      uploadInProgress ||
      acceptedFiles.length ===
        MAX_GEOJSON_FILE_UPLOAD_FOR_TRAINING_AREA_LABELS ||
      acceptedFiles.length === MAX_GEOJSON_FILE_UPLOAD_FOR_TRAINING_AREAS,
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
      const rawFiles: File[] = [];
      const allGeometries: (Polygon | MultiPolygon)[] = [];

      for (const fileObj of acceptedFiles) {
        const { file } = fileObj;
        try {
          const text = await file.text();
          const geojson: FeatureCollection | Feature = JSON.parse(text);

          if (isAOILabelsUpload) {
            rawFiles.push(file);
          } else {
            if (
              !disableFileSizeValidation &&
              validateGeoJSONArea(geojson as Feature)
            ) {
              showErrorToast(
                undefined,
                `File area for ${file.name} exceeds area limit.`,
              );
              continue;
            }
            if (geojson.type === "FeatureCollection") {
              const polygons = geojson.features
                .map((feature) => feature.geometry)
                .filter(isPolygonGeometry);
              if (polygons.length === 0) {
                showErrorToast(
                  undefined,
                  `No valid Polygon features found in ${file.name}.`,
                );
                continue;
              }
              allGeometries.push(...polygons);
            } else if (geojson.type === "Feature") {
              if (isPolygonGeometry(geojson.geometry)) {
                allGeometries.push(geojson.geometry);
              } else {
                showErrorToast(
                  undefined,
                  `Feature geometry in ${file.name} is not a Polygon.`,
                );
                continue;
              }
            } else {
              throw new Error("Invalid GeoJSON format");
            }
          }
        } catch (error: any) {
          showErrorToast(undefined, `Error processing file: ${file.name}`);
        }
      }

      if (!isAOILabelsUpload && allGeometries.length === 0) {
        showErrorToast(undefined, "No valid geometries found to upload.");
        setUploadInProgress(false);
        return;
      }

      const rawUploadPromises = rawFiles.map((file) => uploadRawFile(file));
      const geometryUploadPromises = allGeometries.map((geometry) =>
        fileUploadHandler?.(geometry as Polygon),
      );

      await Promise.all([...rawUploadPromises, ...geometryUploadPromises]);

      successToast && showSuccessToast(successToast);
      resetState();
    } catch (error: any) {
      const errorMessage = error.message || "An error occurred during upload.";
      showErrorToast(undefined, errorMessage);
    } finally {
      setUploadInProgress(false);
    }
  };

  const uploadRawFile = async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append("geojson_file", file);
    rawFileUploadHandler?.(formData);
  };

  const files = acceptedFiles.map((file) => {
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
        </div>
      </li>
    );
  });

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
                  MODELS_CONTENT.modelCreation.trainingArea.fileUploadDialog
                    .mainInstruction
                }
              </p>
              <small className="text-body-4 md:text-body-3 text-center">
                {
                  MODELS_CONTENT.modelCreation.trainingArea.fileUploadDialog
                    .fleSizeInstruction
                }
              </small>
              {!disableFileSizeValidation && (
                <small className="text-body-4 md:text-body-3 text-center">
                  {`Area should be > ${formatAreaInAppropriateUnit(MIN_TRAINING_AREA_SIZE)} and < ${formatAreaInAppropriateUnit(MAX_TRAINING_AREA_SIZE)}.`}
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
              MODELS_CONTENT.modelCreation.trainingArea.form.upload
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default FileUploadDialog;
