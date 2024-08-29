import { ReganShanerComBlogPost } from 'src/content-types/regan-shaner-com-blog-post';
import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { ObsidianDocumentPayload } from 'src/obsidian-document-reader';
import ObsidianFileUtils from 'src/obsidian-file-utils';
import StrapiApiClient from 'src/strapi-api-client';
import StrapiObsidianAdaptor from 'src/strapi-obsidian-adaptor';

interface StrapiUploadPluginSettings {
	authToken: string;
	strapiHost: string;
}

const DEFAULT_SETTINGS: StrapiUploadPluginSettings = {
	authToken: '',
	strapiHost: '',
}

export default class StrapiUploadPlugin extends Plugin {
	settings: StrapiUploadPluginSettings;
	obsidianFileUtils: ObsidianFileUtils;
	strapiApiClient: StrapiApiClient;
	strapiObsidianAdaptor: StrapiObsidianAdaptor;

	async onload() {
		this.obsidianFileUtils = new ObsidianFileUtils(this);

		await this.loadSettings();

		this.strapiApiClient = new StrapiApiClient(this.settings.strapiHost, this.settings.authToken);
		this.strapiObsidianAdaptor = new StrapiObsidianAdaptor(this, this.strapiApiClient);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'upload-to-strapi',
			name: 'Upload current file to strapi',
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile === null) {
					// Show some kind of error
					return;
				}
				await this.strapiObsidianAdaptor.uploadDocumentToStrapi(activeFile, (payload: ObsidianDocumentPayload) => {
					return new ReganShanerComBlogPost({
						Title: payload.getTitle(),
						Date: payload.getFrontMatterProperty("date") as string,
						Body: payload.getContents(),
					});
				});
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new StrapiSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class StrapiSettingTab extends PluginSettingTab {
	plugin: StrapiUploadPlugin;

	constructor(app: App, plugin: StrapiUploadPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Strapi API Token')
			.setDesc('Auth token created in the Strapi UI. Should have permission to create/update/delete content')
			.addText(text => text
				.setPlaceholder('XXXXXXXXXXXXXXXXXX')
				.setValue(this.plugin.settings.authToken)
				.onChange(async (value) => {
					this.plugin.settings.authToken = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Strapi Host')
			.setDesc('Host name of the Strapi instance that content should be uploaded to')
			.addText(text => text
				.setPlaceholder('https://<your-strap-host>')
				.setValue(this.plugin.settings.strapiHost)
				.onChange(async (value) => {
					this.plugin.settings.strapiHost = value;
					await this.plugin.saveSettings();
				}));
	}
}
