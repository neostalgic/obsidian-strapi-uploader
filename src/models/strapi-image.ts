export type StrapiImageFormat = {
    ext: string;
    url: string;
    hash: string;
    mime: string;
    name: string;
    path: string | null;
    size: number;
    width: number;
    height: number;
    sizeInBytes: number;
};

export type StrapiImageFormats = {
    large?: StrapiImageFormat;
    small?: StrapiImageFormat;
    medium?: StrapiImageFormat;
    thumbnail?: StrapiImageFormat;
};

export interface StrapiFile {
    id: number;
    name: string;
    alternativeText: string | null;
    caption: string | null;
    width: number;
    height: number;
    formats: StrapiImageFormats;
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl: string | null;
    provider: string;
    provider_metadata: any | null;
    folderPath: string;
    createdAt: string;
    updatedAt: string;
    folder: string | null;
    isUrlSigned: boolean;
  }
