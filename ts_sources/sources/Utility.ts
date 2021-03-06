import * as _         from 'lodash';
import * as Web3Utils from 'web3-utils';
import { KBucketh }   from './KBucketh';
import { Signale }    from 'signale';

/**
 * Utility function to convert commonly found Ethereum Address formats to
 * serialized format. Commonly found formats are strings with and without prefix,
 * checksummed and not checksummed or Buffers.
 * Serialized format is an Uint8Array, allowing easier manipulation in {@link KBucketh}
 *
 * @param {any} id A commonly formatted Ethereum Address
 */
export function serialize(id: any): Uint8Array {

    if (_.isBuffer(id)) id = id.toString('hex');
    else if (id instanceof Uint8Array) return id;

    if (!Web3Utils.isAddress(id)) throw new Error(`Invalid ID ${id}`);
    if (id.indexOf('0x') === 0) id = id.substr(2);

    const result = [];
    for (let idx = 0; idx < id.length; idx += 2) {
        result.push(parseInt(id.substr(idx, 2), 16));
    }

    return new Uint8Array(result.reverse());
}

/**
 * Utility function to deserialize Ethereum Addresses back to a prefixed and
 * checksummed string format.
 *
 * @param {Uint8Array} id A serialized Ethereum Address
 */
export function deserialize(id: Uint8Array): string {
    try {
        let result = '';

        id = id.reverse();

        for (const val of id) {
            result += (val < 16) ? ('0' + val.toString(16)) : val.toString(16);
        }

        id = id.reverse();

        return (Web3Utils.toChecksumAddress('0x' + result));
    } catch (e) {
        throw new Error(`Invalid deserialization request on ${JSON.stringify([].slice.call(id))}`);
    }
}

/**
 * Calculates distance value between two IDs. Mainly used when requesting
 * nearest nodes stored in the buckets.
 *
 * @param {Uint8Array} id_one
 * @param {Uint8Array} id_two
 */
export function distance(id_one: Uint8Array, id_two: Uint8Array): number {
    let distance = 0;
    for (let idx = 0; idx < id_one.length && idx < id_two.length; ++idx) {
        distance += (id_one[idx] ^ id_two[idx]) * (2 ** ((idx) * 8));
    }
    return distance;
}

/**
 * Calculates first bit difference between two IDs. Mainly used to find
 * in which bucket an ID belongs.
 *
 * @param {Uint8Array} id_one
 * @param {Uint8Array} id_two
 */
export function bitDistance(id_one: Uint8Array, id_two: Uint8Array): number {
    const dist = distance(id_one, id_two);

    for (let idx = 159; idx >= 0; --idx) if (2 ** idx <= dist && dist < 2 ** (idx + 1)) return idx;
    return 0;
}

export function getBucketByID(id: number, kbk: KBucketh): KBucketh {
    if (id === kbk.BucketID) return kbk;
    if (id < kbk.BucketID) return (kbk.left ? getBucketByID(id, kbk.left) : kbk);
    else return (kbk.right ? getBucketByID(id, kbk.right) : kbk);
}

export function getFirst(kbk: KBucketh): KBucketh {
    if (kbk.BucketID !== 0 && kbk.right) {
        return getFirst(kbk.right);
    }
    return kbk;
}

const logger = new Signale({
    types: {
        info: {
            badge: '❕',
            color: 'blueBright',
            label: 'k-BuckΞth'
        },
        warn: {
            badge: '❗️',
            color: 'yellow',
            label: 'k-BuckΞth'
        }
    }
});

export function print(kbk: KBucketh): void {
    kbk = getFirst(kbk);
    for (let navigator_idx = 159; navigator_idx > kbk.BucketID; --navigator_idx) {
        logger.warn(`[ Bucket ID ${navigator_idx} ]`);
    }
    let last_id = kbk.BucketID;
    for (let navigator = kbk; navigator !== null; navigator = navigator.left) {
        logger.info(`[ Bucket ID ${navigator.BucketID} ]\t\t[ Bucket ${navigator.size} ]\t[ Waitlist ${navigator.waitlist_size} ]`);
        last_id = navigator.BucketID;
    }
    for (let navigator_idx = last_id - 1; navigator_idx >= 0; --navigator_idx) {
        logger.warn(`[ Bucket ID ${navigator_idx} ]`);
    }
}
