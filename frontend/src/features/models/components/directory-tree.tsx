import { API_ENDPOINTS, apiClient } from "@/services";
import {
  CloudDownloadIcon,
  DirectoryIcon,
  FileIcon,
} from "@/components/ui/icons";
import { getTrainingWorkspaceQueryOptions } from "@/features/models/api/factory";
import { MODELS_CONTENT, TOAST_NOTIFICATIONS } from "@/constants";
import { showErrorToast, showSuccessToast, truncateString } from "@/utils";
import { Spinner } from "@/components/ui/spinner";
import { TCSSWithVars } from "@/types";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  SlFormatBytes,
  SlTree,
  SlTreeItem,
} from "@shoelace-style/shoelace/dist/react";
import { ToolTip } from "@/components/ui/tooltip";
import { BASE_API_URL } from "@/config";
import { CopyButton } from "@/components/ui/copy-button";

type DirectoryTreeProps = {
  datasetId: number;
  trainingId: number;
  isOpened: boolean;
};

type DirectoryTreeItems = {
  dir: Record<string, DirectoryTreeItems & { size: number; length: number }>;
  file: Record<string, { size: number; length: number }>;
};

const DirectoryLoadingSkeleton = () => (
  <ul className="flex w-full flex-col gap-y-4">
    {new Array(3).fill(null).map((_, id) => (
      <li
        key={`model-file-${id}`}
        className="flex h-10 w-full items-center gap-x-4"
      >
        <div className="h-6 w-[10%] animate-pulse bg-light-gray"></div>
        <div className="h-6 w-[90%] animate-pulse bg-light-gray"></div>
      </li>
    ))}
  </ul>
);

const FileItem = ({
  keyName,
  size,
  onDownload,
  isDownloading,
  trainingId,
  validPath,
}: {
  keyName: string;
  size: number;
  onDownload: () => void;
  isDownloading: boolean;
  trainingId: number;
  validPath: string;
}) => {
  return (
    <div className="group flex cursor-pointer items-center gap-x-2 pr-20">
      <FileIcon className="size-4" />
      <div className="flex flex-col gap-x-2 sm:flex-row">
        <span title={keyName} className="text-nowrap text-body-2base text-dark">
          {truncateString(keyName)}
        </span>
        <span className="flex items-center gap-x-2 text-nowrap text-body-3 text-grey">
          <SlFormatBytes value={size} />
          {isDownloading && <Spinner />}
        </span>
        {validPath && trainingId && (
          <div className="flex items-center gap-x-4 group-hover:inline-flex sm:hidden">
            <ToolTip content="Click to download file.">
              <button disabled={isDownloading} onClick={onDownload}>
                <span className="group-hover:inline">
                  <CloudDownloadIcon className="icon" />
                </span>
              </button>
            </ToolTip>
            <CopyButton
              text={
                BASE_API_URL +
                API_ENDPOINTS.DOWNLOAD_TRAINING_FILE(trainingId, validPath)
              }
              size="small"
              tooltipContent="Click to copy file download link. You can open this link in a new tab to download the file."
            />
          </div>
        )}
      </div>
    </div>
  );
};

const DirectoryItem = ({
  keyName,
  size,
  length,
  children,
}: {
  keyName: string;
  size: number;
  length: number;
  children: React.ReactNode;
}) => (
  <>
    <div className="flex items-center gap-x-2">
      <DirectoryIcon className="size-4" />
      <div className="flex flex-col gap-x-2 md:flex-row">
        <span title={keyName} className="text-nowrap text-body-2base text-dark">
          {truncateString(keyName)}
        </span>
        <div className="flex gap-x-2">
          <span className="text-nowrap text-body-3 text-grey">
            <SlFormatBytes value={size} />
          </span>
          <span className="text-nowrap text-body-3 text-grey">
            {length} items
          </span>
        </div>
      </div>
    </div>
    {children}
  </>
);

const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  datasetId,
  trainingId,
}) => {
  const [directoryTree, setDirectoryTree] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const [downLoadingFilePath, setDownLoadingFilePath] = useState<string>("");

  const fetchDirectoryData = async (path: string = "") => {
    try {
      if (trainingId !== null) {
        return await queryClient.fetchQuery({
          ...getTrainingWorkspaceQueryOptions(trainingId, path),
        });
      }
    } catch {
      setHasError(true);
      return null;
    }
  };

  const fetchDirectoryRecursive = async (
    currentDirectory: string = "",
    currentDepth: number = 0,
    maxDepth: number = 2
  ): Promise<unknown> => {
    if (currentDepth >= maxDepth) {
      return {};
    }

    const data = await fetchDirectoryData(currentDirectory);
    if (!data) return {};

    const { dir, file } = data;

    const subdirectories =
      dir && currentDepth < maxDepth
        ? await Promise.all(
            Object.keys(dir).map(async (key: string) => {
              const fullPath = currentDirectory
                ? `${currentDirectory}/${key}/`
                : key;
              const subDirData = await fetchDirectoryRecursive(
                fullPath,
                currentDepth + 1,
                maxDepth
              );
              return {
                [key]: {
                  ...(typeof subDirData === "object" ? subDirData : {}),
                  size: dir[key]?.size || 0,
                  length: dir[key]?.len || 0,
                },
              };
            })
          )
        : [];

    return {
      dir: Object.assign({}, ...subdirectories),
      file: file || {},
    };
  };

  useEffect(() => {
    const fetchAllDirectories = async () => {
      try {
        setIsLoading(true);
        const rootData = await fetchDirectoryRecursive("");
        setDirectoryTree(rootData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllDirectories();
  }, [datasetId, trainingId]);

  const handleFileDownload = async (validPath: string) => {
    try {
      if (!window.URL) {
        showErrorToast(TOAST_NOTIFICATIONS.fileDownloadBlocked);
        return;
      }
      setDownLoadingFilePath(validPath);
      const response = await apiClient.get(
        API_ENDPOINTS.DOWNLOAD_TRAINING_FILE(trainingId, validPath),
        {
          responseType: "blob",
        }
      );

      if (response.status !== 200) {
        showErrorToast(TOAST_NOTIFICATIONS.fileDownloadFailed);
        return;
      }

      const blob = new Blob([response.data], { type: response.data.type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      //@ts-expect-error bad type definition
      a.download = validPath.split("/").pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showSuccessToast(TOAST_NOTIFICATIONS.fileDownloadSuccess);
    } catch {
      showErrorToast(TOAST_NOTIFICATIONS.fileDownloadFailed);
    } finally {
      setDownLoadingFilePath("");
    }
  };

  const renderTreeItems = (
    items: DirectoryTreeItems,
    parentKey: string = ""
  ) => {
    const combinedItems = {
      ...items.dir,
      ...items.file,
    };

    return Object.entries(combinedItems).map(([key, value]: [string, any]) => {
      const isDirectory =
        Object.prototype.hasOwnProperty.call(value, "dir") ||
        Object.prototype.hasOwnProperty.call(value, "length");
      const currentPath = parentKey ? `${parentKey}/${key}` : key;
      return (
        <SlTreeItem key={currentPath}>
          {isDirectory ? (
            <DirectoryItem
              keyName={key}
              size={value.size}
              length={value.length}
            >
              {renderTreeItems(value, currentPath)}
            </DirectoryItem>
          ) : (
            <FileItem
              keyName={key}
              size={value.size}
              onDownload={() => handleFileDownload(currentPath)}
              isDownloading={downLoadingFilePath === currentPath}
              validPath={currentPath}
              trainingId={trainingId}
            />
          )}
        </SlTreeItem>
      );
    });
  };

  if (isLoading) return <DirectoryLoadingSkeleton />;
  if (hasError)
    return (
      <div>
        {MODELS_CONTENT.models.modelsDetailsCard.modelFilesDialog.error}
      </div>
    );

  return (
    <SlTree style={{ "--indent-guide-width": "1px" } as TCSSWithVars}>
      <SlTreeItem key="root">
        <DirectoryIcon className="mr-2 size-4" />
        <span>
          {
            MODELS_CONTENT.models.modelsDetailsCard.modelFilesDialog
              .rootDirectory
          }
        </span>
        {directoryTree && renderTreeItems(directoryTree)}
      </SlTreeItem>
    </SlTree>
  );
};

export default DirectoryTree;
