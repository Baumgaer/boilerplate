export interface context {
    [key: string]: any
    count?: number;
    ordinal?: boolean;
    postProcess?: string;
}
