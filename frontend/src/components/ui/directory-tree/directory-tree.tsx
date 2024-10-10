
import SlTree from '@shoelace-style/shoelace/dist/react/tree/index.js';
import SlTreeItem from '@shoelace-style/shoelace/dist/react/tree-item/index.js';
import { DirectoryIcon, FileIcon } from '@/components/ui/icons';

const DirectoryTree = () => {
    return (
        //@ts-expect-error
        <SlTree class="tree-with-icons" style={{ '--indent-guide-width': '1px', '--indent-size': '20px' }}>
            <SlTreeItem>
                <DirectoryIcon className='w-4 h-4 mr-2' />
                Root
                <SlTreeItem>
                    <DirectoryIcon className='w-4 h-4 mr-2' />
                    Folder 1
                    <SlTreeItem>
                        <FileIcon className='w-4 h-4 mr-2' />
                        File 1 - 1
                    </SlTreeItem>
                </SlTreeItem>
                <SlTreeItem>
                    <DirectoryIcon className='w-4 h-4 mr-2' />
                    Folder 2
                    <SlTreeItem>
                        <FileIcon className='w-4 h-4 mr-2' />
                        File 2 - 1
                    </SlTreeItem>
                    <SlTreeItem>
                        <FileIcon className='w-4 h-4 mr-2' />
                        File 2 - 2
                    </SlTreeItem>
                </SlTreeItem>
                <SlTreeItem>
                    <FileIcon className='w-4 h-4 mr-2' />
                    File 1
                </SlTreeItem>
            </SlTreeItem>
        </SlTree>
    );
};


export default DirectoryTree;