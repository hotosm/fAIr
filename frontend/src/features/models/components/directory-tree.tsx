import { DirectoryIcon, FileIcon } from "@/components/ui/icons";
import {
  SlFormatBytes,
  SlTree,
  SlTreeItem,
} from "@shoelace-style/shoelace/dist/react";
import { useState, useEffect } from "react";
import {
  APP_CONTENT,
  showErrorToast,
  showSuccessToast,
  truncateString,
} from "@/utils";
import { TOAST_NOTIFICATIONS } from "@/constants";
import { useQueryClient } from "@tanstack/react-query";
import { getTrainingWorkspaceQueryOptions } from "@/features/models/api/factory";
import { API_ENDPOINTS, apiClient } from "@/services";
import { Spinner } from "@/components/ui/spinner";

type DirectoryTreeProps = {
  datasetId: number;
  trainingId: number;
  isOpened: boolean;
};

const DirectoryLoadingSkeleton = () => (
  <ul className="flex gap-y-4 flex-col">
    {new Array(5).fill(null).map((_, id) => (
      <li
        key={`model-file-${id}`}
        className="h-10 flex gap-x-4 w-full items-center"
      >
        <div className="h-10 w-[10%] animate-pulse bg-light-gray"></div>
        <div className="h-6 w-[60%] animate-pulse bg-light-gray"></div>
      </li>
    ))}
  </ul>
);

const FileItem = ({
  keyName,
  size,
  onDownload,
  isDownloading,
}: {
  keyName: string;
  size: number;
  onDownload: () => void;
  isDownloading: boolean;
}) => (
  <div className="flex items-center gap-x-2" onClick={onDownload}>
    <FileIcon className="w-4 h-4" />
    <div className="flex flex-col md:flex-row gap-x-2">
      <span title={keyName} className="text-dark text-nowrap text-body-2base">
        {truncateString(keyName)}
      </span>
      <span className="text-gray text-body-3 text-nowrap flex items-center gap-x-2">
        <SlFormatBytes value={size} />
        {isDownloading && <Spinner />}
      </span>
    </div>
  </div>
);

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
      <DirectoryIcon className="w-4 h-4" />
      <div className="flex flex-col md:flex-row gap-x-2">
        <span title={keyName} className="text-dark text-nowrap text-body-2base">
          {truncateString(keyName)}
        </span>
        <div className="flex gap-x-2">
          <span className="text-gray text-body-3 text-nowrap">
            <SlFormatBytes value={size} />
          </span>
          <span className="text-gray text-body-3 text-nowrap">
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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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
    maxDepth: number = 2,
  ): Promise<any> => {
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
              maxDepth,
            );
            return {
              [key]: {
                ...subDirData,
                size: dir[key]?.size || 0,
                length: dir[key]?.len || 0,
              },
            };
          }),
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
      setDownLoadingFilePath(validPath);
      const response = await apiClient.get(
        API_ENDPOINTS.DOWNLOAD_TRAINING_FILE(trainingId, validPath),
        {
          responseType: "blob",
        },
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
    } catch (error) {
      showErrorToast(error);
    } finally {
      setDownLoadingFilePath("");
    }
  };

  const renderTreeItems = (items: any, parentKey: string = "") => {
    const combinedItems = {
      ...items.dir,
      ...items.file,
    };

    return Object.entries(combinedItems).map(([key, value]: [string, any]) => {
      const isDirectory = value.hasOwnProperty("dir");
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
            />
          )}
        </SlTreeItem>
      );
    });
  };

  if (isLoading) return <DirectoryLoadingSkeleton />;
  if (hasError)
    return (
      <div>{APP_CONTENT.models.modelsDetailsCard.modelFilesDialog.error}</div>
    );

  return (
    //@ts-expect-error bad type definition
    <SlTree style={{ "--indent-guide-width": "1px" }}>
      <SlTreeItem key="root">
        <DirectoryIcon className="w-4 h-4 mr-2" />
        <span>
          {APP_CONTENT.models.modelsDetailsCard.modelFilesDialog.rootDirectory}
        </span>
        {directoryTree && renderTreeItems(directoryTree)}
      </SlTreeItem>
    </SlTree>
  );
};

export default DirectoryTree;
