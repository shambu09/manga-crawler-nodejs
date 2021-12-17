require("dotenv").config();
const { crawl } = require("./src/spider.js");

crawl("https://readmanganato.com/manga-ax951880", 0, 101, "manhua");
