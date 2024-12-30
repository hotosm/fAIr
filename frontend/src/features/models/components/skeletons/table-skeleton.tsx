import {
  Table,
  TableBody,
  TableCell,
  TableRow
  } from '@/components/ui/table';

const TableSkeleton = () => {
  return (
    <Table className="w-full">
      <TableBody>
        {Array.from({ length: 15 }).map((_, rowIdx) => (
          <TableRow key={rowIdx} className="animate-pulse">
            {Array.from({ length: 6 }).map((_, colIdx) => (
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
