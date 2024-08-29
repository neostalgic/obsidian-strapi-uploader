import { Plugin, TFile } from "obsidian";

export default class ObsidianFileUtils {
    plugin: Plugin

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async readFileBinary(file: TFile): Promise<ArrayBuffer> {
        return await this.plugin.app.vault.readBinary(file);
    }

    getEmbedsFromFileContents(fileContents: string): TFile[] {
        const embeds = this.findEmbeds(fileContents);
        console.log(embeds);
        const foundFiles = this.searchEmbedFiles(embeds);
        return foundFiles;
    }

    private findEmbeds(content: string): string[] {
        const embedRegex = /!\[\[([^\]]+)\]\]/g;
        const embeds: string[] = [];
        let match;
    
        while ((match = embedRegex.exec(content)) !== null) {
            embeds.push(match[1]);
        }
    
        return embeds;
    }

    private searchEmbedFiles(embedFileNames: string[]): TFile[] {
        return this.plugin.app.vault.getFiles().filter((file) => {
            return embedFileNames.find(embedName => file.name.indexOf(embedName) >= 0) !== undefined
        })
    }
}