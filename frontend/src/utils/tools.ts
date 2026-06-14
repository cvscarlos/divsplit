export function jsonStringifySafe(obj: unknown): string {
	try {
		return JSON.stringify(obj);
	} catch (error) {
		console.error('Error stringifying object:', error);
		return '';
	}
}

export function jsonParseSafe<T = unknown>(jsonString: string): T | Record<string, never> {
	try {
		return JSON.parse(jsonString) as T;
	} catch (error) {
		console.error('Error parsing JSON string:', error);
		return {};
	}
}
