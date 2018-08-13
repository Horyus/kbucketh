import * as _ from 'lodash';
import * as Web3Utils from 'web3-utils';

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
    if (!Web3Utils.isAddress(id)) throw new Error(`Invalid ID ${id}`);
    if (id.indexOf('0x') === 0) id = id.substr(2);

    const result = [];
    for (let idx = 0; idx < id.length; idx += 2) {
        result.push(parseInt(id.substr(idx, 2), 16));
    }

    return new Uint8Array(result);
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

        for (const val of id) {
            result += (val < 16) ? ('0' + val.toString(16)) : val.toString(16);
        }

        return (Web3Utils.toChecksumAddress('0x' + result));
    } catch (e) {
        throw new Error(`Invalid deserialization request on ${JSON.stringify([].slice.call(id))}`);
    }
}
