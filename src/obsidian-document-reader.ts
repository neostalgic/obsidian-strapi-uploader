import {Plugin, TFile, getFrontMatterInfo, parseYaml} from 'obsidian';

export class ObsidianDocumentPayload {
    private title: string;
    private frontmatter: any;
    private contents: string;

    constructor(title: string, frontmatter: any, contents: string) {
        this.title = title;
        this.frontmatter = frontmatter;
        this.contents = contents;
    }

    getTitle(): string {
        return this.title;
    }

    getFrontMatterProperty(prop: string): unknown {
        return this.frontmatter[prop] || ''
    }

    getContents(): string {
        return this.contents;
    }
}

export default class ObsidianDocumentReader {
    plugin: Plugin;

    file: TFile;

    private title?: string;
    private fileContents?: string;
    private strippedFileContents?: string;
    private frontmatter?: any;
    private embeddedFiles: TFile[];

    private loaded: boolean = false;

    constructor(plugin: Plugin, file: TFile) {
        this.plugin = plugin;
        this.file = file;
    }

    async load() {
        this.title = this.file.basename;
        this.fileContents = await this.plugin.app.vault.cachedRead(this.file);
        if (this.fileContents === undefined) {
            throw new Error("Cannot load contents of file");
        }
        this.strippedFileContents = this.stripFrontmatter(this.fileContents);

        this.frontmatter = this.loadFrontmatter(this.fileContents);
        this.embeddedFiles = this.loadEmbeddedFiles(this.fileContents);

        this.loaded = true;
    }

    getTitle(): string {
        this.loadCheck();

        return this.title!;
    }

    getContents(): string {
        this.loadCheck();

        return this.fileContents!;
    }

    getStrippedContents(): string {
        this.loadCheck();

        return this.strippedFileContents!;
    }

    getFrontMatterProperty(prop: string): unknown {
        this.loadCheck();

        return this.frontmatter[prop] || undefined;
    }

    getEmbeddedFiles(): TFile[] {
        this.loadCheck();

        return this.embeddedFiles;
    }

    getDocumentPayload(transformFn?: () => string): ObsidianDocumentPayload {
        this.loadCheck();
        const transformedContents = transformFn ? transformFn() : '';
        return new ObsidianDocumentPayload(this.title!, this.frontmatter!, transformedContents || this.strippedFileContents!)
    }

    private loadCheck() {
        if (!this.loaded) {
            throw new Error("No file loaded in reader");
        }
    }

    private stripFrontmatter(fileContents: string): string {
        const lines = fileContents.split('\n');
        if (lines[0] === '---') {
            // Find the end of the frontmatter
            let endIndex = 1;
            while (endIndex < lines.length && lines[endIndex] !== '---') {
                endIndex++;
            }
            // Skip the frontmatter lines
            const content = lines.slice(endIndex + 1);
            return content.join('\n');
        } else {
            return fileContents;
        }
    }

    private loadFrontmatter(fileContents: string): any {
        // What if there isn't any frontmatter?
        const frontMatterInfo = getFrontMatterInfo(fileContents);
        return parseYaml(frontMatterInfo.frontmatter);
    }

    private loadEmbeddedFiles(fileContents: string): TFile[] {
        const embeds = this.processEmbeddedFiles(fileContents);
        const foundFiles = this.findEmbeddedFiles(embeds);
        return foundFiles;
    }

    private processEmbeddedFiles(content: string): string[] {
        const embedRegex = /!\[\[([^\]]+)\]\]/g;
        const embeds: string[] = [];
        let match;
    
        while ((match = embedRegex.exec(content)) !== null) {
            embeds.push(match[1]);
        }
    
        return embeds;
    }

    private findEmbeddedFiles(embedFileNames: string[]): TFile[] {
        return this.plugin.app.vault.getFiles().filter((file) => {
            return embedFileNames.find(embedName => file.name.indexOf(embedName) >= 0) !== undefined
        })
    }
}