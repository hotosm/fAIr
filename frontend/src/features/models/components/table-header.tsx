import { SortIcon } from "@/components/ui/icons";
import { Column } from "@tanstack/react-table";

type DataTableColumnHeaderProps<TData, TValue> = {
    column: Column<TData, TValue>;
    title: string;
};

export const SortableHeader = <TData, TValue>({ title, column }: DataTableColumnHeaderProps<TData, TValue>) => {
    return (
        <span
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-x-2"
        >
            {title}
            <SortIcon className='icon' />
        </span>
    );
};