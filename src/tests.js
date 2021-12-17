const { assert } = require("console");
require("dotenv").config();

//------------------------------------------------------------------------------
//------------------------------asyncLimit test---------------------------------

function test_delay() {
	const { asyncLimit, delay } = require("./utils.js");

	async function test_asyncLimit() {
		console.log("Test");
		await delay(4000);
	}

	fn = asyncLimit(test_asyncLimit, 4);

	fn();
	fn();
	fn();
	fn();
}

//------------------------------------------------------------------------------
async function test_drive() {
	const fs = require("fs");
	const drive = await require("./gdrive.js");
	folder_id = await drive.createFolder("testhaha", drive.PARENT_FOLDER_ID);

	const file = fs.createReadStream("./0.jpg");
	console.log(typeof file);
	const file_id = await drive.uploadFile(
		"test.jpg",
		folder_id,
		file,
		"image/jpeg"
	);
	console.log(file_id);
}

//------------------------------------------------------------------------------
async function donwload_image() {
	const axios = require("axios");
	const drive = await require("./gdrive.js");
	url =
		"https://upload.wikimedia.org/wikipedia/commons/b/b6/Image_created_with_a_mobile_phone.png";
	const resp = await axios.get(url, { responseType: "stream" });
	const file = resp.data;
	drive.uploadFile("test.png", drive.PARENT_FOLDER_ID, file, "image/png");
}

//------------------------------------------------------------------------------
async function main() {
	// test_delay();
	// test_drive();
	donwload_image();
}

main();
