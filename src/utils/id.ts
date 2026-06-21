import ObjectId from 'bson-objectid';

/**
 * The single id generator for the whole app — events, members, transactions,
 * activities and the device id all use this. One scheme (24-char ObjectId hex)
 * avoids the bugs that come from mixing formats when comparing/looking up ids.
 */
export const generateId = (): string => new ObjectId().toHexString();
