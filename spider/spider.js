const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const { asyncLimit, delay } = require("../utils.js");

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
	return { title, images, pages: images.length };
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
	const url = chapter.url;
	chapter = await fetch_images_urls(chapter.title, chapter.url);

	const images = await Promise.all(
		chapter.images.map((image) => fetch_resp({ ...data, url: image.url }))
	);

	const dir = `./res/${title}/${chapter.title}`;
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	for (const [i, image] of images.entries()) {
		const file = fs.createWriteStream(`${dir}/${i}.jpg`);
		await image.pipe(file);
	}
	return { title, url, pages: images.length, chapter: idx };
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
	const url = "https://readmanganato.com/manga-oc955385";
	let { title, chapters } = await extract_index(url);
	chapters = chapters.reverse().slice(start, end);
	const chapter_metas = await download_all_images(title, chapters);
	console.log(chapter_metas);
}

_main((start = 0), (end = 1));
