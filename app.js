const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const { crawl } = require("./crawler");

// crawl("https://readmanganato.com/manga-ax951880", 101, 111, "manhua");

//allow cross-origin requests
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	if (req.method !== "OPTIONS") {
		next();
	} else {
		res.sendStatus(200);
	}
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
	// serve the static html file
	res.sendFile(__dirname + "/index.html");
});

app.post("/crawl_manga", (req, res) => {
	if (!req.body) return res.sendStatus(400);

	let { url, start, end, type } = req.body;
	if (!url || start === null || end === null) return res.sendStatus(400);
	if (!type) type = "manga";

	crawl(url, start, end, type);
	res.send("Crawling started");
	res.end();
});

app.post("/test", (req, res) => {
	if (!req.body) return res.sendStatus(400);

	let { url, start, end, type } = req.body;
	if (!url || start === null || end === null) return res.sendStatus(400);
	if (!type) type = "manga";

	console.log(url, start, end, type);
	res.send("Crawling started");
	res.end();
});

app.listen(port, () => {
	console.log(`Manga Crawler Server listening on port ${port}\n`);
});
