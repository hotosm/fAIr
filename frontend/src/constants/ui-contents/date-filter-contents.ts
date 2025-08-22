import { DateFilter } from "@/types";

export const dateFilters: DateFilter[] = [
  {
    label: "Date Created",
    apiValue: "created_at",
    searchParams: "dateCreated",
  },
  {
    label: "Last Modified",
    apiValue: "last_modified",
    searchParams: "lastModified",
  },
];
