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

exports.arrayDiff = arrayDiff;
