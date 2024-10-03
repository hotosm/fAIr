export const extractDatePart = (isoString: string) => {
    return isoString.split('T')[0];
}
