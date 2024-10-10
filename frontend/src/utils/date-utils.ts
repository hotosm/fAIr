import { DateFilter } from "@/types";

export const extractDatePart = (isoString: string) => {
    return isoString.split('T')[0];
}



export const buildDateFilterQueryString = (
    selectedFilter?: DateFilter,
    startDate?: string,
    endDate?: string
): Record<string, string> => {

    const params: Record<string, string> = {};
    if (startDate) {
        params[`${selectedFilter?.apiValue}__gte`] = startDate;
    }
    if (endDate) {
        params[`${selectedFilter?.apiValue}__lte`] = endDate;
    }

    return Object.assign({}, params);
};



export const formatDate = (isoString: string): string => {
    const date = new Date(isoString);

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}
