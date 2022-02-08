require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pageTypes = require('./pageTypes');

const generateUrl = (type, query = '') => {
	const { PROJECT_ID, SANITY_API, API_VERSION, DATASET } = process.env;

	const baseUrl = `https://${PROJECT_ID}.${SANITY_API}/${API_VERSION}/data`;

	const urlTypes = {
		query: `${baseUrl}/query/${DATASET}?query=${encodeURIComponent(query)}`,
		mutate: `${baseUrl}/mutate/${DATASET}?returnIds=true`,
	};

	if (!urlTypes[type]) {
		throw new Error(`Invalid urlType: ${type}`);
	}

	return urlTypes[type];
};

const buildPatchQuery = (data) => {
	if (!data || !data.result) {
		throw new Error('You need to provide a data value');
	}

	const pages = data.result
		.filter(
			(page) =>
				pageTypes.includes(page._type) && page.body && page.body.length > 0
		)
		.map((page) => ({
			patch: {
				id: page._id,
				set: {
					'body[_type=="resourceCards"].style': 'new',
				},
			},
		}));

	return pages;
};

const fetchPages = async (query) => {
	const url = generateUrl('query', query);

	const response = await axios({
		method: 'get',
		url: url,
		headers: {
			'Content-type': 'application/json',
			Authorization: `Bearer ${process.env.SANITY_EDIT_TOKEN}`,
		},
	});

	return response.data;
};

const writeLog = (patchData, result) => {
	try {
		if (!patchData || !result) {
			throw new Error('There is no data provided');
		}

		const dir = path.join(__dirname, 'logs');

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}

		const currentDate = new Date();
		const YEAR = currentDate.getFullYear();
		const MONTH = ('0' + (currentDate.getMonth() + 1)).slice(-2);
		const DAY = ('0' + currentDate.getDate()).slice(-2);
		const HOURS = ('0' + currentDate.getHours()).slice(-2);
		const MINUTES = ('0' + currentDate.getMinutes()).slice(-2);
		const SECONDS = ('0' + currentDate.getSeconds()).slice(-2);

		const stringDate = `${YEAR}-${MONTH}-${DAY}_${HOURS}:${MINUTES}:${SECONDS}`;

		fs.writeFileSync(
			path.join(dir, `${stringDate}-pages.json`),
			JSON.stringify(patchData, null, 2)
		);
		fs.writeFileSync(
			path.join(dir, `${stringDate}-pagesUpdated.json`),
			JSON.stringify(result, null, 2)
		);
	} catch (error) {
		throw new Error(error.message);
	}
};

const init = async () => {
	if (!pageTypes || pageTypes.length === 0) {
		throw new Error('No page types found :(');
	}

	let query = '*[_type in [';

	pageTypes.forEach((page) => (query += `"${page}",`));
	query = `${query.slice(0, -1)}]]{_id, _type, body[_type == "resourceCards"]}`;

	const genericPages = await fetchPages(query);
	const patchGenericPages = buildPatchQuery(genericPages);

	let draftQuery = `*[_id in path("drafts.**")]{_id, _type, body[_type == "resourceCards"]}`;
	const draftPages = await fetchPages(draftQuery);
	const patchDraftPages = buildPatchQuery(draftPages);

	const mutations = {
		mutations: [...patchGenericPages, ...patchDraftPages],
	};

	if (mutations.mutations.length === 0) {
		console.log('No data to update!!!');
		return;
	}

	const url = generateUrl('mutate');

	const result = await axios({
		method: 'post',
		url,
		headers: {
			'Content-type': 'application/json',
			Authorization: `Bearer ${process.env.SANITY_EDIT_TOKEN}`,
		},
		data: JSON.stringify(mutations),
	});

	writeLog(mutations, result.data);

	console.log('The pages update has been done!');
};

init();
