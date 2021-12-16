require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const {put_manga, update_index} = require("../db.js");

const { asyncLimit, delay } = require("../utils.js");
var global = {
	drive: null,
};

async function _fetch_resp(req) {
	let resp = null;
	try {
		resp = await axios(req);
	} catch (err) {
		console.log(err);
	}
	return resp.data;
}
const fetch_resp = asyncLimit(_fetch_resp, 20);

async function fetch_images_urls(title, url) {
	const resp = await fetch_resp(url);
	const $ = cheerio.load(resp);
	let images = $(".container-chapter-reader>img").toArray();
	images = images.map((image, i) => {
		return {
			url: image.attribs.src,
			page: i + 1,
		};
	});
	return { title, images, pages: images.length, url };
}

async function extract_index(url) {
	const resp = await fetch_resp(url);
	const $ = cheerio.load(resp);
	let title = $("div.story-info-right>h1").toArray()[0];
	let chapters = $("li.a-h>a").toArray();

	title = title.children[0].data;
	chapters = chapters.map((chapter) => {
		return {
			url: chapter.attribs.href,
			title: chapter.children[0].data,
		};
	});

	return { title, chapters };
}

async function download_images(title, chapter, idx) {
	data = {
		method: "GET",
		responseType: "stream",
		headers: {
			Referer: "https://mangakakalot.com/",
		},
	};
	chapter = await fetch_images_urls(chapter.title, chapter.url);

	const images = await Promise.all(
		chapter.images.map((image) => fetch_resp({ ...data, url: image.url }))
	);

	const folder_id = await global.drive.createFolder(
		`${idx}`,
		global.drive.PARENT_FOLDER_ID
	);

	chapter["drive_id"] = folder_id;
	chapter["drive_url"] = global.drive.get_public_url_folder(folder_id);
	chapter["images_links"] = {};

	file_ids = await Promise.all(
		images.map(async (image, i) => {
			const file_id = await global.drive.uploadFile(
				`${i}.jpg`,
				folder_id,
				image,
				"image/jpeg"
			);
			return file_id;
		})
	);

	for (const [i, file_id] of file_ids.entries()) {
		chapter["images_links"][i + 1] =
			global.drive.get_public_url_file(file_id);
	}

	delete chapter.images;
	delete images

	return { ...chapter, chapter:idx};
}

async function download_all_images(title, chapters) {
	let chapter_metas = [];
	let chapter = null;
	for (const [i, chapter] of chapters.entries()) {
		console.log(`Downloading ${chapter.title}`);

		const chapter_meta = await download_images(title, chapter, i + 1);
		chapter_metas.push(chapter_meta);

		console.log(`Downloaded ${chapter.title}`);
	}
	return chapter_metas;
}

async function _main(start, end) {
	const drive = await require("../gdrive.js");
	global.drive = drive;
	const METADATA_JSON = process.env.METADATA_JSON;

	const url = "https://readmanganato.com/manga-oc955385";
	let { title, chapters } = await extract_index(url);

	const _title = `${title} (${start} - ${end})`;
	drive.PARENT_FOLDER_ID = await drive.createFolder(
		_title,
		drive.PARENT_FOLDER_ID
	);

	global.drive.put

	chapters = chapters.reverse().slice(start, end);
	let chapter_metas = await download_all_images(title, chapters);
	chapter_metas = {
		title: _title,
		num_chapters: chapter_metas.length,
		type: "manga",
		chapters: chapter_metas,
	}
	//JSON.Stringify with Indentation
	const file_id = await global.drive.uploadFile("metadata.json", drive.PARENT_FOLDER_ID, JSON.stringify(chapter_metas, null, 6), "application/json");
	const index = await global.drive.downloadJson(METADATA_JSON);
	
	index[file_id] = _title
	await global.drive.updateJson(METADATA_JSON, index);

	put_manga(file_id, chapter_metas);

	idx_ele = {};
	idx_ele[file_id]= _title;

	update_index(idx_ele);
}

_main((start = 0), (end = 1));
