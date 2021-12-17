const asyncLimit = (fn, n) => {
	let pendingPromises = [];
	return async function (...args) {
		while (pendingPromises.length >= n) {
			await Promise.race(pendingPromises).catch(() => {});
		}

		const p = fn.apply(this, args);
		pendingPromises.push(p);
		await p.catch(() => {});
		pendingPromises = pendingPromises.filter((pending) => pending !== p);
		return p;
	};
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { asyncLimit, delay };
