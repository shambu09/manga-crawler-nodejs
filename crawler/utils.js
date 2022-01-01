const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const asyncLimit = (fn, n, delay_s = 1000) => {
	let pendingPromises = [];
	return async function (...args) {
		while (pendingPromises.length >= n) {
			await Promise.race(pendingPromises).catch(() => {});
			await delay(1000);
		}

		const p = fn.apply(this, args);
		pendingPromises.push(p);
		await p.catch(() => {});
		pendingPromises = pendingPromises.filter((pending) => pending !== p);
		return p;
	};
};

module.exports = { asyncLimit, delay };
