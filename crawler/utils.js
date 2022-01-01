const retry = require("retry");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const asyncLimit = (fn, n, delay_s = 1000) => {
	let pendingPromises = [];
	let operation = retry.operation({
		retries: 5,
		factor: 3,
		minTimeout: 1 * 1000,
		maxTimeout: 60 * 1000,
		randomize: true,
	});

	const n_fn = async (...args) => {
		let result = null;
		await operation.attempt(async () => {
			result = await fn.apply(this, args);
		});
		return result;
	};

	return async function (...args) {
		while (pendingPromises.length >= n) {
			await Promise.race(pendingPromises).catch(() => {});
			await delay(1000);
		}

		const p = n_fn.apply(this, args);
		pendingPromises.push(p);
		await p.catch(() => {});
		pendingPromises = pendingPromises.filter((pending) => pending !== p);
		return p;
	};
};

module.exports = { asyncLimit, delay };
