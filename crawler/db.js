const axios = require("axios");
const URL = "https://manga-utils-server.herokuapp.com";

async function put_manga(file_id, metadata) {
	metadata._id = file_id;
	metadata._meta = 1;

	req_meta = {
		method: "PUT",
		url: `${URL}/add_manga`,
		data: metadata,
		headers: {
			"Content-Type": "application/json",
		},
	};
	const resp = await axios(req_meta);
	return resp.data;
}

async function update_index(index_element) {
	index_element = JSON.stringify(index_element);
	req_meta = {
		method: "PATCH",
		url: `${URL}/change_index`,
		data: index_element,
		headers: {
			"Content-Type": "application/json",
		},
	};

	const resp = await axios(req_meta);
	return resp.data;
}

module.exports = {
	put_manga,
	update_index,
};
