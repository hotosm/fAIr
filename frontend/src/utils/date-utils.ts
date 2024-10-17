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


export const formatDuration = (startDate: Date, endDate: Date): string => {
    const diff = Math.abs(endDate.getTime() - startDate.getTime());

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let result = '';
    if (hours > 0) result += `${hours}hr `;
    if (minutes > 0) result += `${minutes} Mins `;
    if (seconds > 0 || result === '') result += `${seconds} Secs`;

    return result.trim();
}
