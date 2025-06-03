export function jsonStringifySafe(obj) {
	try {
		return JSON.stringify(obj);
	} catch (error) {
		console.error('Error stringifying object:', error);
		return '{}';
	}
}

export function jsonParseSafe(jsonString) {
	try {
		return JSON.parse(jsonString);
	} catch (error) {
		console.error('Error parsing JSON string:', error);
		return {};
	}
}
