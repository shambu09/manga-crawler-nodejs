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

function main() {
	test_delay();
}

main();
