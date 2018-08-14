declare var describe;
declare var test;
declare var expect;

import { create, KBKAddReturn, KBKRemoveReturn, KBucketh }    from './KBucketh';
import { deserialize, serialize, getBucketByID, bitDistance } from './Utility';
import * as RandomString                                      from 'randomstring';
import * as _                                                 from 'lodash';

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

    describe('constructor && create', () => {

        test('Creating manual KBucketh Instance with PeerID ' + my_id, () => {

            const bucket = new KBucketh(my_id, 0, shared_registry, 15);
            expect(_.isEqual(bucket.PeerID, serialize(my_id))).toBe(true);
            expect(bucket.DeserializedPeerID).toBe(deserialize(serialize(my_id)));
            expect(bucket.BucketID).toBe(0);
            expect(bucket.size).toBe(0);
            expect(bucket.limit).toBe(15);
            expect(bucket.waitlist_size).toBe(0);
        });

        test('Creating from create, without configuration', () => {
            const bucket = create(my_id);
            expect(bucket.BucketID).toBe(0);
            expect(bucket.size).toBe(0);
            expect(bucket.limit).toBe(20);
            expect(bucket.waitlist_size).toBe(0);
        });

        test('Creating from create, with custom bit_distance', () => {
            const bucket = create(my_id, {bit_distance: 2});
            expect(bucket.BucketID).toBe(2);
            expect(bucket.size).toBe(0);
            expect(bucket.limit).toBe(20);
            expect(bucket.waitlist_size).toBe(0);
        });

        test('Creating from create, with custom bucket size', () => {
            const bucket = create(my_id, {bucket_size: 10});
            expect(bucket.BucketID).toBe(0);
            expect(bucket.size).toBe(0);
            expect(bucket.limit).toBe(10);
            expect(bucket.waitlist_size).toBe(0);
        });

        test('Creating from create, with custom bit_distance and bucket size', () => {
            const bucket = create(my_id, {bit_distance: 2, bucket_size: 10});
            expect(bucket.BucketID).toBe(2);
            expect(bucket.size).toBe(0);
            expect(bucket.limit).toBe(10);
            expect(bucket.waitlist_size).toBe(0);
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

    describe('add', () => {

        test('Add peer', () => {
            const bucket = create(my_id, {bit_distance: 1});
            for (let idx = 0; idx < 100; ++idx) {
                bucket.add<void>('0x' + RandomString.generate({length: 40, charset: 'hex'}), void 0);
            }
        });

        test('Add towards left', () => {
            const bucket = create('0x0000000000000000000000000000000000000000', {bit_distance: 80});
            const ret = bucket.add<void>('0x0100000000000000000000000000000000000100', void 0);
            expect(bucket.right).toBe(null);
            expect(bucket.left).not.toBe(null);
            expect(ret).toBe(KBKAddReturn.AddedToBucket);
        });

        test('Add peer twice', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            bucket.add<void>('0x0100000000000000000000000000000000000100', void 0);
            const ret = bucket.add<void>('0x0100000000000000000000000000000000000100', void 0);
            expect(bucket.right).not.toBe(null);
            expect(bucket.left).toBe(null);
            expect(ret).toBe(KBKAddReturn.AlreadyExists);
        });

    });

    describe('remove', () => {

        test('Far test', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            bucket.add<void>('0x0000000000000000000000000000000000000100', void 0);
            const ret = bucket.remove('0x0000000000000000000000000000000000000100');
            expect(bucket.right).toBe(null);
            expect(bucket.left).toBe(null);
            expect(ret).toBe(KBKRemoveReturn.RemovedFromBucket);
        });

        test('Far test, call from middle', () => {
            let bucket = create('0x0000000000000000000000000000000000000000');
            bucket.add<void>('0x0000000000000000000000000000000000000100', void 0);
            bucket.add<void>('0x0100000000000000000000000000000000000100', void 0);
            bucket = getBucketByID(80, bucket);
            bucket.remove('0x0100000000000000000000000000000000000100');
            expect(bucket.right).not.toBe(null);
            expect(bucket.left).not.toBe(null);
        });

        test('Far test, call from end', () => {
            let bucket = create('0x0000000000000000000000000000000000000000');
            bucket.add<void>('0x0000000000000000000000000000000000000100', void 0);
            bucket = getBucketByID(159, bucket);
            bucket.remove('0x0000000000000000000000000000000000000100');
            expect(bucket.right).toBe(null);
            expect(bucket.left).not.toBe(null);
        });

        test('Far test, call from begin', () => {
            let bucket = create('0x0000000000000000000000000000000000000000', {bit_distance: 10});
            bucket.add<void>('0x0000000000000000000000000000000000000100', void 0);
            bucket = getBucketByID(159, bucket);
            bucket = getBucketByID(0, bucket);
            bucket.remove('0x0000000000000000000000000000000000000100');
            expect(bucket.right).toBe(null);
            expect(bucket.left).toBe(null);
        });

        test('Removing from waitlist', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            while (bucket.size < bucket.limit) {
                bucket.add<void>('0x' + RandomString.generate({length: 40, charset: 'hex'}), void 0);
            }
            let waitlist_address;
            let waitlist_ret;
            while (bucket.waitlist_size === 0) {
                waitlist_address = '0x' + RandomString.generate({length: 40, charset: 'hex'});
                waitlist_ret = bucket.add<void>(waitlist_address, void 0);
            }
            const ret = bucket.remove(waitlist_address);
            expect(bucket.waitlist_size).toBe(0);
            expect(ret).toBe(KBKRemoveReturn.RemovedFromWaitlist);
            expect(waitlist_ret).toBe(KBKAddReturn.AddedToWaitlist);
        });

        test('Remove while empty', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            const ret = bucket.remove('0x0000000000000000000000000000000000000100');
            expect(ret).toBe(KBKRemoveReturn.NotFound);
        });

        test('Remove non existing from non empty bucket', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            bucket.add<void>('0x0000000000000000000000000000000000000002', void 0);
            const ret = bucket.remove('0x0000000000000000000000000000000000000006');
            expect(ret).toBe(KBKRemoveReturn.NotFound);
        });
    });

});
