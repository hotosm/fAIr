import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

const TableSkeleton = ({ rows = 15, columns = 6 }: {
  rows?: number;
  columns?: number;
}) => {
  return (
    <Table className="w-full">
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <TableRow key={rowIdx} className="animate-pulse">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <TableCell key={colIdx} className="p-2">
                <div className="h-6 bg-light-gray"></div>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TableSkeleton;
