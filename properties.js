const fs = require('fs');
const os = require('os');
const path = require('path');

/* ensure file exists */
const filePath = path.resolve(os.homedir(), '.neo');
const fd = fs.openSync(filePath, 'a');
fs.closeSync(fd);

const propertiesReader = require('properties-reader');
const properties = propertiesReader(filePath);

class Properties {
	static get(propName) {
		return properties.get(propName);
	}

	static put(propName, propValue) {
		properties.set(propName, propValue);
	}

	static async save() {
		return new Promise((resolve, reject) => {
			properties.save(filePath, (err, res) => {
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}
}

exports.Properties = Properties;
