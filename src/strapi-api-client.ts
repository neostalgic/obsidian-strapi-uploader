import { StrapiContentType } from "src/content-types/strapi-content-type";
import { StrapiFilesResponse } from "src/models/strapi-files-response";
import { StrapiFile } from "src/models/strapi-image";
import { RequestUrlParam, TFile, getBlobArrayBuffer, requestUrl } from "obsidian";

const mimeTypes: { [key: string]: string } = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'mkv': 'video/x-matroska',
    'webm': 'video/webm'
};

export type UploadFileResult = {
    file: TFile,
    strapiFile: StrapiFile
}

export default class StrapiApiClient {
    strapiHost: string;
    strapiToken: string;

    constructor(strapiHost: string, strapiToken: string) {
        this.strapiHost = strapiHost;
        this.strapiToken = strapiToken;
    }

    async createEntry<T>(contentType: StrapiContentType<T>): Promise<any> {
        const adaptedBody = {
            data: contentType.getData()
        }

        const requestBody = JSON.stringify(adaptedBody);

        const createEntryRequest: RequestUrlParam = {
            url: `${this.strapiHost}/api/${contentType.getPluralName()}`,
            method: "POST",
            body: requestBody,
            contentType: 'application/json',
            headers: {
                "Authorization": `Bearer ${this.strapiToken}`
            }
        }

        try {
            const response = await requestUrl(createEntryRequest);
            console.log(response.json);
            return response.json
        } catch (error) {
            throw(error);
        }
    }

    async getFiles(): Promise<StrapiFile[]> {
        // Set to 1000 right now - should be fine for awhile
        // Ultimately we want to paginate this and roll through all the pages.
        const queryParams = `?sort=createdAt:DESC&page=1&pageSize=1000`

        const getAllFilesRequest: RequestUrlParam =  {
            url: `${this.strapiHost}/api/upload/files`,
            method: "GET",
            headers: {
                "Authorization": `Bearer ${this.strapiToken}`
            }
        }

        try {
            const response = await requestUrl(getAllFilesRequest);
            return response.json
        } catch (error) {
            console.log(error);
            throw(error);
        }
        
    }

    async uploadFile(file: TFile, binary: ArrayBuffer, replaceFile = true): Promise<UploadFileResult> {
        if (!replaceFile) {
            const strapiFiles = await this.getFiles();
            const foundFile = strapiFiles.find(strapiFile => file.name === strapiFile.name)

            console.log(foundFile);

            if (foundFile !== undefined) {
                return {
                    file,
                    strapiFile: foundFile
                };
            }
        }

        const uploadFileRequest = await this.generateMultiPartFormDataRequest(file, binary);
        try {
            const response = await requestUrl(uploadFileRequest);
            const strapiUploadResponse: StrapiFile[] = response.json;

            return {
                file,
                strapiFile: strapiUploadResponse[0]
            };
        } catch (error) {
            console.log(error);
            throw(error);
        }
    }

    private async generateMultiPartFormDataRequest(file: TFile, binary: ArrayBuffer): Promise<RequestUrlParam> {
        const N = 16 // The length of our random boundry string
        const randomBoundryString = "obsidianBoundry" + Array(N + 1).join((Math.random().toString(36) + '00000000000000000').slice(2, 18)).slice(0, N)

        const mimeType = mimeTypes[file.extension];

        const body = await this.createMultiPartString(randomBoundryString, file.name, mimeType, binary);

        return {
            url: `${this.strapiHost}/api/upload`,
            method: "POST",
            body,
            contentType: `multipart/form-data; boundary=----${randomBoundryString}`,
            headers: {
                "Authorization": `Bearer ${this.strapiToken}`
            }
        }
    }

    private async createMultiPartString(boundryString: string, fileName: string, mimeType: string, arrayBuffer: ArrayBuffer) {

        // Construct the form data payload as a string
        const pre_string = `------${boundryString}\r\nContent-Disposition: form-data; name="files"; filename="${fileName}"\r\nContent-Type: "${mimeType}"\r\n\r\n`;
        const post_string = `\r\n------${boundryString}--`

        // Convert the form data payload to a blob by concatenating the pre_string, the file data, and the post_string, and then return the blob as an array buffer
        const pre_string_encoded = new TextEncoder().encode(pre_string);
        const data = new Blob([arrayBuffer]);
        const post_string_encoded = new TextEncoder().encode(post_string);
        return await new Blob([pre_string_encoded, await getBlobArrayBuffer(data), post_string_encoded]).arrayBuffer()
    }
}