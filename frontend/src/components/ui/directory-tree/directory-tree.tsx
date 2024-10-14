import SlTree from '@shoelace-style/shoelace/dist/react/tree/index.js';
import SlTreeItem from '@shoelace-style/shoelace/dist/react/tree-item/index.js';
import { DirectoryIcon, FileIcon } from '@/components/ui/icons';
import SlFormatBytes from '@shoelace-style/shoelace/dist/react/format-bytes/index.js';
import { useEffect, useState } from 'react';
import { useTrainingWorkspace } from '@/features/models/hooks/use-training';
import { truncateString } from '@/utils/string-utils';

type DirectoryTreeProps = {
    datasetId: number;
    trainingId: number;
};


const DirectoryLoadingSkeleton = () => {
    return (
        <ul className='flex gap-y-4 flex-col'>
            {new Array(2).fill(null).map((_, id) => (
                <li key={`model-file-${id}`} className='h-10 flex gap-x-4 w-full items-center'>
                    <div className='h-10 w-[10%] animate-pulse bg-light-gray'></div>
                    <div className='h-6 w-[60%] animate-pulse bg-light-gray'></div>
                </li>
            ))}
        </ul>
    );
};

const DirectoryTree: React.FC<DirectoryTreeProps> = ({ datasetId, trainingId }) => {
    const [lazyDirs, setLazyDirs] = useState<{ [key: string]: boolean }>({});
    const [expandedDirs, setExpandedDirs] = useState<{ [key: string]: any }>({});
    const [initialData, setInitialData] = useState<any>(null);
    const [currentDirectory, setCurrentDirectory] = useState<string>('');


    const { data: rootData, isLoading: loadingRoot, isError: errorRoot } = useTrainingWorkspace(datasetId, trainingId, '');

    useEffect(() => {
        if (rootData) {
            setInitialData(rootData);
            setExpandedDirs(prev => ({ ...prev, '': rootData }));
            setLazyDirs(prev => ({ ...prev, '': false }));
        }
    }, [rootData]);


    const handleLazyLoad = (dirKey: string, parentPath: string) => {

        const newPath = parentPath ? `${parentPath}/${dirKey}` : dirKey;
        setLazyDirs(prev => ({ ...prev, [newPath]: false }));
        setCurrentDirectory(newPath);
    };


    const { data, isError } = useTrainingWorkspace(datasetId, trainingId, currentDirectory);

    useEffect(() => {
        if (data && currentDirectory) {

            setExpandedDirs(prev => ({
                ...prev,
                [currentDirectory]: {
                    dir: data.dir || {},
                    file: data.file || {},
                }
            }));
        }
    }, [data, currentDirectory]);


    const renderTreeItems = (items: any, parentKey: string = '') => {

        const combinedItems = {
            ...items.dir,
            ...items.file
        };

        return Object.entries(combinedItems).map(([key, value]: [string, any]) => {
            const isDirectory = typeof value === 'object' && value.hasOwnProperty('len');

            return (
                <SlTreeItem
                    key={`${parentKey}-${key}`}
                    lazy={isDirectory && lazyDirs[key] !== false}
                    onSlLazyLoad={() => handleLazyLoad(key, parentKey)}
                >
                    {isDirectory ? (
                        <>
                            <DirectoryIcon className="w-4 h-4 mr-2" />
                            <span title={key} className='text-nowrap'>{truncateString(key)}</span>
                            <span className='ml-3 text-body-3 text-gray text-nowrap'>
                                <SlFormatBytes value={value.size} /> {value.len} {value.len > 1 ? 'files' : 'file'}
                            </span>
                            {lazyDirs[key] === false && isError && <div>Error loading directory</div>}
                            {lazyDirs[key] === false && expandedDirs[key] && renderTreeItems(expandedDirs[key], key)}
                        </>
                    ) : (
                        <div className='flex items-center gap-x-3'>
                            <FileIcon className="w-4 h-4 mr-2" />
                            <span title={key} className='text-nowrap'>{truncateString(key)}</span>
                            <span className='text-body-3 text-gray text-nowrap'>
                                <SlFormatBytes value={value.size} />
                            </span>
                        </div>
                    )}
                </SlTreeItem>
            );
        });
    };


    if (loadingRoot) return <DirectoryLoadingSkeleton />;


    if (errorRoot) return <div className='flex items-center justify-center'>An error occurred while loading the root directory.</div>;

    return (
        <SlTree
            className="tree-with-icons"
            //@ts-expect-error
            style={{ '--indent-guide-width': '1px', '--indent-size': '20px' }}
        >
            <SlTreeItem
                key="root"
                lazy={false}
            >
                <DirectoryIcon className="w-4 h-4 mr-2" />
                Root Directory
                {initialData.dir && renderTreeItems(initialData)}
            </SlTreeItem>
        </SlTree>
    );
};

export default DirectoryTree;
