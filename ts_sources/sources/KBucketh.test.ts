declare var describe;
declare var test;
declare var expect;

import { create, KBucketh }       from './KBucketh';
import { deserialize, serialize } from './Utility';
import * as RandomString          from 'randomstring';
import * as _                     from 'lodash';

const my_id = '0x' + RandomString.generate({length: 40, charset: 'hex'});
const other_id: string = deserialize(serialize('0x' + RandomString.generate({length: 40, charset: 'hex'})));
const shared_registry = {
    [other_id]: 123
};

const ids = [];
for (let generate_idx = 0; generate_idx < 10; ++generate_idx) {
    ids.push(serialize('0x' + RandomString.generate({length: 40, charset: 'hex'})));
}
ids.push(serialize('0x0000000000000000000000000000000000000000'));
ids.push(serialize('0xffffffffffffffffffffffffffffffffffffffff'));
ids.push(serialize('0x0000000000000000000000000000000000000001'));
ids.push(serialize('0x0000000000000000000000000000000000000100'));
ids.push(serialize('0x0000000000000000000000000000010000000000'));
ids.push(serialize('0x1010101010101010101010101010101010101010'));

describe('KBucketh Test Suite', () => {

    test('Creating manual KBucketh Instance with PeerID ' + my_id, () => {

        const bucket = new KBucketh(my_id, 0, shared_registry, 15);
        expect(_.isEqual(bucket.PeerID, serialize(my_id))).toBe(true);
        expect(bucket.DeserializedPeerID).toBe(deserialize(serialize(my_id)));
        expect(bucket.BucketID).toBe(0);
        expect(bucket.size).toBe(15);
        expect(bucket.limit).toBe(15);

    });

    test('Creating from create, without configuration', () => {
        const bucket = create(my_id);
        expect(bucket.BucketID).toBe(0);
        expect(bucket.size).toBe(20);
    });

    test('Creating from create, with custom bit_distance', () => {
        const bucket = create(my_id, {bit_distance: 2});
        expect(bucket.BucketID).toBe(2);
        expect(bucket.size).toBe(20);
    });

    test('Creating from create, with custom bucket size', () => {
        const bucket = create(my_id, {bucket_size: 10});
        expect(bucket.BucketID).toBe(0);
        expect(bucket.size).toBe(10);
    });

    test('Creating from create, with custom bit_distance and bucket size', () => {
        const bucket = create(my_id, {bit_distance: 2, bucket_size: 10});
        expect(bucket.BucketID).toBe(2);
        expect(bucket.size).toBe(10);
    });

    test('Getting bucketID of ' + other_id, () => {

        const bucket = new KBucketh(my_id, 0, shared_registry, 15);
        expect(bucket.bucketIDOf(other_id)).toBe(123);

    });

    test('Getting bucketID of ' + my_id, () => {

        const bucket = new KBucketh(my_id, 0, shared_registry, 15);
        expect(bucket.bucketIDOf(my_id)).toBe(-1);

    });

});
