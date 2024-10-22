import { DirectoryIcon, FileIcon } from "@/components/ui/icons";
import SlFormatBytes from "@shoelace-style/shoelace/dist/react/format-bytes/index.js";
import { useState, useEffect } from "react";
import { APP_CONTENT, truncateString } from "@/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  SlTree,
  SlTreeItem,
} from "@shoelace-style/shoelace/dist/react/index.js";
import { getTrainingWorkspaceQueryOptions } from "@/features/models/hooks/factory";
import { API_ENDPOINTS } from "@/services";
import { Link } from "@/components/ui/link";
import { ENVS } from "@/config/env";

type DirectoryTreeProps = {
  datasetId: number;
  trainingId: number;
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
  datasetId, 
  trainingId, 
  validPath
}: {
  keyName: string;
  size: number;
  datasetId:number 
  trainingId:number 
  validPath:string 
}) => {
  const fullURL = `${ENVS.BASE_API_URL}${API_ENDPOINTS.DOWNLOAD_TRAINING_FILE(datasetId, trainingId, validPath)}`
  return(
    <Link href={fullURL} download blank nativeAnchor title={truncateString(keyName) as string} className="!lowercase">
    <div className="flex items-center gap-x-2">
      <FileIcon className="w-4 h-4" />
      <div className="flex flex-col md:flex-row gap-x-2">
        <span title={keyName} className="text-dark text-nowrap text-body-2base">
          {truncateString(keyName)}
        </span>
        <span className="text-gray text-body-3 text-nowrap flex items-center gap-x-2">
          <SlFormatBytes value={size} />
        </span>
      </div>
    </div>
  </Link>
  )
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


  const fetchDirectoryData = async (path: string = "") => {
    try {
      return await queryClient.fetchQuery({
        ...getTrainingWorkspaceQueryOptions(datasetId, trainingId, path),
      });
    } catch {
      setHasError(true);
      return null;
    }
  };

  const fetchDirectoryRecursive = async (
    currentDirectory: string = "",
  ): Promise<any> => {
    const data = await fetchDirectoryData(currentDirectory);
    if (!data) return {};

    const { dir, file } = data;
    const subdirectories = dir
      ? await Promise.all(
          Object.keys(dir).map(async (key: string) => {
            const fullPath = currentDirectory
              ? `${currentDirectory}/${key}`
              : key;
            const subDirData = await fetchDirectoryRecursive(fullPath);
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
      setIsLoading(true);
      const rootData = await fetchDirectoryRecursive("");
      setDirectoryTree(rootData);
      setIsLoading(false);
    };

    fetchAllDirectories();
  }, [datasetId, trainingId]);

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
              datasetId={datasetId}
              trainingId={trainingId}
              validPath={currentPath}
            />
          )}
        </SlTreeItem>
      );
    });
  };

  if (isLoading) return <DirectoryLoadingSkeleton />;
  if (hasError)
    return (
      <div>{APP_CONTENT.models.modelsDetailsCard.modelFilesDialog.error}.</div>
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
