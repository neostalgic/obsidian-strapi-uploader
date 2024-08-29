import { StrapiFile } from "./strapi-image";

export interface Pagination {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
}

export interface StrapiFilesResponse {
    results: StrapiFile[];
    pagination: Pagination;
}