const { assert } = require("console");
const { google } = require("googleapis");
const { asyncLimit, delay } = require("./utils.js");

const LIMIT = 20;

class GoogleDrive {
	constructor() {
		this.PARENT_FOLDER_ID = "";
		this.SCOPE = ["https://www.googleapis.com/auth/drive"];
		this.CREDS_PATH = "./credentials.json";
		this.TIME = null;
		this.REFRESH_TIME = 2100;
		this.drive = null;
	}

	initializeService(CREDS_PATH, SCOPE) {
		this.CREDS_PATH = CREDS_PATH;
		this.SCOPE = SCOPE;
	}

	async getDrive() {
		const auth = new google.auth.GoogleAuth({
			keyFile: this.CREDS_PATH,
			scopes: this.SCOPE,
		});
		const client = await auth.getClient();

		this.drive = google.drive({
			version: "v3",
			auth: client,
		});

		this.drive;
	}

	async init(PARENT_FOLDER_ID, CREDS_PATH = "./credentials.json") {
		this.PARENT_FOLDER_ID = PARENT_FOLDER_ID;
		this.initializeService(CREDS_PATH, this.SCOPE);
		await this.getDrive();
		this.TIME = Date.now();
	}

	async createFolder(folder_name, parent_id) {
		console.log(`Creating folder ${parent_id}`);
		const folder_metadata = {
			name: folder_name,
			mimeType: "application/vnd.google-apps.folder",
			parents: [parent_id],
		};
		let folder = {};
		try {
			folder = await this.drive.files.create({
				resource: folder_metadata,
				fields: "id",
			});
		} catch (e) {
			console.log(e);
		}
		return folder.data.id;
	}

	async listFiles(folder_id) {
		let files = [];
		try {
			files = await this.drive.files.list({
				q: `'${folder_id}' in parents`,
				fields: "nextPageToken, files(id, name)",
			});
		} catch (e) {
			console.log(e);
		}
		return files.data.files;
	}

	async uploadFile(name, parent_id, binary_data, mimetype) {
		assert(
			[
				"image/jpeg",
				"image/png",
				"application/pdf",
				"textx/plain",
				"application/json",
			].includes(mimetype),
			"Invalid mimetype"
		);
		assert(parent_id, "Invalid parent_id");

		const file_metadata = {
			name: name,
			mimeType: mimetype,
			parents: [parent_id],
		};

		const media = {
			mimeType: mimetype,
			body: binary_data,
		};

		const file = await this.drive.files.create({
			resource: file_metadata,
			media: media,
			fields: "id",
		});
		return file.data.id;
	}

	async downloadJson(file_id) {
		const file = await this.drive.files.get({
			fileId: file_id,
			alt: "media",
			mimeType: "application/json",
		});
		return file.data;
	}

	async updateJson(file_id, data) {
		const file = await this.drive.files.update({
			fileId: file_id,
			media: {
				mimeType: "application/json",
				body: JSON.stringify(data),
			},
			fields: "id",
		});
		return file.data.id;
	}

	get_public_url_file(file_id) {
		return `https://drive.google.com/uc?export=view&id=${file_id}`;
	}

	get_public_url_folder(file_id) {
		return `https://drive.google.com/drive/folders/${file_id}?usp=sharing`;
	}
}

// apply asyncLimit to the GoogleDrive.uploadFile function:
GoogleDrive.prototype.uploadFile = asyncLimit(
	GoogleDrive.prototype.uploadFile,
	LIMIT
);

const drive = new GoogleDrive();

module.exports = new Promise((resolve, reject) => {
	drive.init(process.env.DATA_FOLDER_ID, "./credentials.json").then((err) => {
		if (err) {
			reject(err);
		} else {
			resolve(drive);
		}
	});
});
