import { describe, it, expect } from 'vitest';

import { remoteChangesToVersions } from './sync';

describe('remoteChangesToVersions', () => {
	it('maps the server change log to ordered local versions (summary → changes)', () => {
		const versions = remoteChangesToVersions([
			{ _id: 'a', ts: '2026-06-01T00:00:00.000Z', author: 'Ana', summary: [{ key: 'EVENT_CREATED' }], delta: {} },
			{ _id: 'b', ts: '2026-06-02T00:00:00.000Z', author: 'Bo', summary: [{ key: 'TX_ADDED' }], delta: {} },
		]);

		expect(versions.map((v) => v.v)).toEqual([1, 2]);
		expect(versions.map((v) => v.id)).toEqual(['a', 'b']);
		expect(versions[1].author).toBe('Bo');
		expect(versions[1].changes).toEqual([{ key: 'TX_ADDED' }]);
	});

	it('defaults a missing summary/author to empty', () => {
		const [v] = remoteChangesToVersions([{ _id: 'x', ts: '2026-06-01T00:00:00.000Z' }]);
		expect(v.changes).toEqual([]);
		expect(v.author).toBe('');
	});
});
