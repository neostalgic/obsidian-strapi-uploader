import { StrapiContentType } from 'src/content-types/strapi-content-type';
import { Plugin, TFile } from 'obsidian';
import ObsidianDocumentReader, { ObsidianDocumentPayload } from 'src/obsidian-document-reader';
import StrapiApiClient, { UploadFileResult } from 'src/strapi-api-client';

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

export default class StrapiObsidianAdaptor {
    private plugin: Plugin;
    private strapiApiClient: StrapiApiClient;

    constructor(plugin: Plugin, strapiApiClient: StrapiApiClient) {
        this.plugin = plugin;
        this.strapiApiClient = strapiApiClient;
    }

    async uploadDocumentToStrapi<T>(document: TFile, mappingFn: (payload: ObsidianDocumentPayload) => StrapiContentType<T>) {
        const obsidianFileReader = new ObsidianDocumentReader(this.plugin, document);
        await obsidianFileReader.load();

        const embeddedFiles = obsidianFileReader.getEmbeddedFiles();
        const uploadFileResults: UploadFileResult[] = await this.uploadMediaToStrapi(embeddedFiles);
        const replacementMap = this.createAssetTagReplacementMap(uploadFileResults);


        const obsidianDocumentPayload = obsidianFileReader.getDocumentPayload(() => {
            return this.replaceAssetTags(obsidianFileReader.getStrippedContents(), replacementMap);
        })

        const entry = mappingFn(obsidianDocumentPayload);
        const response = await this.strapiApiClient.createEntry(entry);
        console.log(response);
        console.log('hi');
    }

    private async uploadMediaToStrapi(mediaFiles: TFile[]): Promise<UploadFileResult[]> {
        const readAndUpload = mediaFiles.map(async (file) => {
            const binary = await this.plugin.app.vault.readBinary(file)
            return await this.strapiApiClient.uploadFile(file, binary, false);
        })

        const uploadFileResults: UploadFileResult[] = await Promise.all(readAndUpload);

        return uploadFileResults;
    }

    private createAssetTagReplacementMap(uploadFileResults: UploadFileResult[]): Map<string, string> {
        const replacementMap = new Map<string, string>();
        uploadFileResults.forEach(result =>  {
            console.log(result.strapiFile);
            if (result.strapiFile.mime.contains('image')) {
                replacementMap.set(`![[${result.file.name}]]`, `![${result.strapiFile.name}](${result.strapiFile.url})`)
            }
            if (result.strapiFile.mime.contains('video')) {
                replacementMap.set(`![[${result.file.name}]]`, `[${result.strapiFile.name}](${result.strapiFile.url})`)
            }
        });
        console.log(replacementMap);
        return replacementMap;
    }

    private getFileType(extension: string): string {
        const mimeType = mimeTypes[extension.toLowerCase()];
        if (!mimeType) {
            return 'unknown';
        } else if (mimeType.startsWith('image/')) {
            return 'image';
        } else if (mimeType.startsWith('video/')) {
            return 'video';
        }
        return 'unknown';
    }

    private replaceAssetTags(content: string, replacementMap: Map<string, string>): string {
        const imageMarkdownReplacements = Array.from(replacementMap.keys()).map(key => key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));

        const re = new RegExp(imageMarkdownReplacements.join("|"), "gi");
        return content.replace(re, matched => replacementMap.get(matched) || '');
    }
}