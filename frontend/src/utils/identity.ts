/**
 * Trust-based identity (no accounts, no login).
 *
 * - A single device id is generated once and kept locally — "this person".
 * - Per event, the device remembers which member it is (chosen on first open
 *   of the event's secret link). Used to attribute activity to a name.
 */

const UID_KEY = 'divsplit_uid';
const NAME_KEY = 'divsplit_name';
const identityKey = (eventId: string) => `divsplit_identity_${eventId}`;

export function getDeviceUid(): string {
	let uid = localStorage.getItem(UID_KEY);
	if (!uid) {
		uid = crypto.randomUUID();
		localStorage.setItem(UID_KEY, uid);
	}
	return uid;
}

export function getEventMemberId(eventId: string): string | null {
	return localStorage.getItem(identityKey(eventId));
}

export function setEventMemberId(eventId: string, memberId: string): void {
	localStorage.setItem(identityKey(eventId), memberId);
}

export function clearEventMemberId(eventId: string): void {
	localStorage.removeItem(identityKey(eventId));
}

/** Remembered across events so the "I'm not listed" field can pre-fill. */
export function getPreferredName(): string {
	return localStorage.getItem(NAME_KEY) || '';
}

export function setPreferredName(name: string): void {
	if (name.trim()) localStorage.setItem(NAME_KEY, name.trim());
}
