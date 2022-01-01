const retry = require("retry");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const asyncLimit = (fn, n, delay_s = 1000) => {
	let pendingPromises = [];

	async function limiter(...args) {
		while (pendingPromises.length >= n) {
			await Promise.race(pendingPromises).catch(() => {});
			await delay(1000);
		}

		const p = fn.apply(this, args);
		pendingPromises.push(p);
		await p.catch(async (err) => {
			console.log(err);
			pendingPromises = pendingPromises.filter(
				(pending) => pending !== p
			);
			delay(1000);
			return await limiter.apply(this, args);
		});
		pendingPromises = pendingPromises.filter((pending) => pending !== p);
		return p;
	}

	return limiter;
};

module.exports = { asyncLimit, delay };
