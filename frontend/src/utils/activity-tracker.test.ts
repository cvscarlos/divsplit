import { describe, it, expect } from 'vitest';

import { ACTIVITY_TYPES, trackEventCreated, trackTransferRecorded, trackTransferRemoved } from './activity-tracker';
import type { Group } from '../types';

const group: Group = { config: {} };

describe('trackEventCreated', () => {
	it('adds exactly one "created" entry even if called more than once', () => {
		// Regression: a first-persist race must not log "Event created" twice.
		const once = trackEventCreated({ config: {} });
		const twice = trackEventCreated(once);
		const created = (twice.activities ?? []).filter((a) => a.type === ACTIVITY_TYPES.GROUP_CREATED);
		expect(created).toHaveLength(1);
	});
});

describe('transfer activity helpers', () => {
	it('records a transfer as a named key with payer, payee and amount as params', () => {
		const updated = trackTransferRecorded(group, 'Bob', 'Carol', 40);
		const entry = updated.activities?.[0];
		expect(entry?.type).toBe(ACTIVITY_TYPES.TRANSFER_RECORDED);
		expect(entry?.description).toBe('TRANSFER_PAID');
		expect(entry?.details).toMatchObject({ from: 'Bob', to: 'Carol', amount: 40 });
	});

	it('records a transfer removal', () => {
		const updated = trackTransferRemoved(group, 'Bob', 'Carol', 40);
		expect(updated.activities?.[0]?.type).toBe(ACTIVITY_TYPES.TRANSFER_REMOVED);
	});
});
