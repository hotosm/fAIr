/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface IconProps extends React.SVGProps<SVGSVGElement> { }

export type ShoelaceSlotProps = {
    slot?: string;
}


export type DateFilter = {
    label: string
    apiValue: string
    searchParams: string
}

export type TQueryParams = Record<string, string | number | boolean>