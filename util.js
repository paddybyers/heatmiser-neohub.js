function arrayDiff(first, second) {
	const firstOnly = [];
	const secondOnly = [];
	const both = [];

	for(const i of first) {
		if(second.includes(i)) {
			both.push(i);
		} else {
			firstOnly.push(i);
		}
	}
	for(const i of second) {
		if(!first.includes(i)) {
			secondOnly.push(i);
		}
	}
	return [firstOnly, secondOnly, both];
}

function mapObject(obj, valueXform) {
	const res = {};
	for(const [k, v] of Object.entries(obj)) {
		res[k] = valueXform(v);
	}
	return res;
}

exports.arrayDiff = arrayDiff;
exports.mapObject = mapObject;
