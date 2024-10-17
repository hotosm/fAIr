export const truncateString = (string?: string, maxLength: number = 30) => {
    if (string && string.length > maxLength) {
        return `${string.slice(0, maxLength - 3)}...`;
    }
    return string;
}

