declare var describe;
declare var test;
declare var expect;

import { create, KBKAddReturn, KBKRemoveReturn, KBKSetReturn, KBKUpdateReturn, KBucketh } from './KBucketh';
import { deserialize, serialize, getBucketByID, bitDistance, distance }                   from './Utility';
import * as RandomString                                                                  from 'randomstring';
import * as _                                                                             from 'lodash';

const my_id = '0x' + RandomString.generate({length: 40, charset: 'hex'});
const other_id: string = deserialize(serialize('0x' + RandomString.generate({length: 40, charset: 'hex'})));
const shared_registry = {
    peers: [serialize(other_id)]
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

type Done = (arg?: any) => void;

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
            expect(bucket.BucketID).toBe(159);
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
            expect(bucket.BucketID).toBe(159);
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

    });

    describe('add', () => {

        test('Add peer', () => {
            const bucket = create(my_id, {bit_distance: 1});
            for (let idx = 0; idx < 100; ++idx) {
                bucket.add<void>('0x' + RandomString.generate({length: 40, charset: 'hex'}), void 0);
            }
        });

        test('Add towards right', () => {
            const bucket = create('0x0000000000000000000000000000000000000000', {bit_distance: 80});
            const ret = bucket.add<void>('0x0100000000000000000000000000000000000100', void 0);
            expect(bucket.right).not.toBe(null);
            expect(bucket.left).toBe(null);
            expect(ret).toBe(KBKAddReturn.AddedToBucket);
        });

        test('Add peer twice', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            bucket.add<void>('0x0100000000000000000000000000000000000100', void 0);
            const ret = bucket.add<void>('0x0100000000000000000000000000000000000100', void 0);
            expect(bucket.right).toBe(null);
            expect(bucket.left).not.toBe(null);
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
            bucket.add<void>('0x0100000000000000000000000000000000000000', void 0);
            bucket = getBucketByID(80, bucket);
            bucket.remove('0x0100000000000000000000000000000000000100');
            expect(bucket.right).not.toBe(null);
            expect(bucket.left).not.toBe(null);
        });

        test('Far test, call from end', () => {
            let bucket = create('0x0000000000000000000000000000000000000000');
            bucket.add<void>('0x0000000000000000000000000000000000000100', void 0);
            bucket = getBucketByID(0, bucket);
            bucket.remove('0x0000000000000000000000000000000000000100');
            expect(bucket.right).not.toBe(null);
            expect(bucket.left).toBe(null);
        });

        test('Far test, call from begin', () => {
            let bucket = create('0x0000000000000000000000000000000000000000', {bit_distance: 149});
            bucket.add<void>('0x0001000000000000000000000000000000000000', void 0);
            bucket = getBucketByID(0, bucket);
            bucket = getBucketByID(159, bucket);
            bucket.remove('0x0001000000000000000000000000000000000000');
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
            bucket.add<void>('0x0000000000000000000000000000000000000005', void 0);
            const ret = bucket.remove('0x0000000000000000000000000000000000000004');
            expect(ret).toBe(KBKRemoveReturn.NotFound);
        });
    });

    describe('get', () => {

        test('Get info from empty bucket', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            const ret = bucket.get('0x0000000000000000000000000000000000000002');
            expect(ret).toBe(null);
        });

        test('Get info from existing peer', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            bucket.add<number>('0x0000000000000000000000000000000000000002', 12);
            const ret = bucket.get('0x0000000000000000000000000000000000000002');
            expect(ret.waitlist).toBe(false);
            expect(ret.bucketID).toBe(1);
            expect(ret.data).toBe(12);
        });

        test('Get info from existing peer in waitlist', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            while (bucket.size < bucket.limit) {
                bucket.add<void>('0x' + RandomString.generate({length: 40, charset: 'hex'}), void 0);
            }
            let waitlist_address;
            let waitlist_ret;
            while (bucket.waitlist_size === 0) {
                waitlist_address = '0x' + RandomString.generate({length: 40, charset: 'hex'});
                waitlist_ret = bucket.add<number>(waitlist_address, 25);
            }
            const ret = bucket.get(waitlist_address);
            expect(ret.waitlist).toBe(true);
            expect(ret.data).toBe(25);
        });

        test('Get info from non-existing peer', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            bucket.add<number>('0x0000000000000000000000000000000000000005', 12);
            const ret = bucket.get('0x0000000000000000000000000000000000000004');
            expect(ret).toBe(null);
        });

    });

    describe('set', () => {

        test('Set info from empty bucket', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            const ret = bucket.set<string>('0x0000000000000000000000000000000000000002', 'hi');
            expect(ret).toBe(KBKSetReturn.NotFound);
        });

        test('Set info from existing peer', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            bucket.add<number>('0x0000000000000000000000000000000000000005', 12);
            bucket.add<number>('0x0000000000000000000000000000000000000004', 12);
            let ret = bucket.get('0x0000000000000000000000000000000000000005');
            expect(ret.waitlist).toBe(false);
            expect(ret.bucketID).toBe(2);
            expect(ret.data).toBe(12);
            ret = bucket.set<string>('0x0000000000000000000000000000000000000005', 'hi');
            expect(ret).toBe(KBKSetReturn.EditedFromBucket);
            ret = bucket.get('0x0000000000000000000000000000000000000005');
            expect(ret.waitlist).toBe(false);
            expect(ret.bucketID).toBe(2);
            expect(ret.data).toBe('hi');
        });

        test('Set info from existing peer in waitlist', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            while (bucket.size < bucket.limit) {
                bucket.add<void>('0x' + RandomString.generate({length: 40, charset: 'hex'}), void 0);
            }
            let waitlist_address;
            let waitlist_ret;
            while (bucket.waitlist_size <= 1) {
                waitlist_address = '0x' + RandomString.generate({length: 40, charset: 'hex'});
                waitlist_ret = bucket.add<number>(waitlist_address, 25);
            }
            let ret = bucket.get(waitlist_address);
            expect(ret.waitlist).toBe(true);
            expect(ret.data).toBe(25);
            ret = bucket.set<string>(waitlist_address, 'hi');
            expect(ret).toBe(KBKSetReturn.EditedFromWaitlist);
            ret = bucket.get(waitlist_address);
            expect(ret.waitlist).toBe(true);
            expect(ret.data).toBe('hi');
        });

        test('Set info of non-existing peer', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            bucket.add<number>('0x0000000000000000000000000000000000000005', 12);
            const ret = bucket.set<string>('0x0000000000000000000000000000000000000004', 'hi');
            expect(ret).toBe(KBKSetReturn.NotFound);
        });

    });

    describe('update', () => {

        test('Update timestamp of empty bucket', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            const ret = bucket.update('0x0000000000000000000000000000000000000002');
            expect(ret).toBe(KBKUpdateReturn.NotFound);
        });

        test('Update peer from bucket', (done: Done) => {
            let bucket = create('0x0000000000000000000000000000000000000000');
            bucket.add<number>('0x0000000000000000000000000000000000000005', 12);
            bucket.add<number>('0x0000000000000000000000000000000000000004', 12);
            const ret = bucket.get('0x0000000000000000000000000000000000000005');
            expect(ret.waitlist).toBe(false);
            expect(ret.bucketID).toBe(2);
            expect(ret.data).toBe(12);
            bucket = getBucketByID(2, bucket);
            expect(bucket.list[0]).toBe('0x0000000000000000000000000000000000000004');
            setTimeout(() => {
                const ret = bucket.update('0x0000000000000000000000000000000000000005');
                if (ret !== KBKUpdateReturn.UpdatedFromBucket) return done(new Error('Invalid returned value'));
                return done((bucket.list[0] === '0x0000000000000000000000000000000000000005') ? undefined : new Error('Invalid peer in head of list'));
            }, 1000);
        });

        test('Update peer from waitlist', (done: Done) => {
            let bucket = create('0x0000000000000000000000000000000000000000');
            while (bucket.size < bucket.limit) {
                bucket.add<void>('0x' + RandomString.generate({length: 40, charset: 'hex'}), void 0);
            }
            let waitlist_address;
            let waitlist_ret;
            while (bucket.waitlist_size <= 1) {
                waitlist_address = '0x' + RandomString.generate({length: 40, charset: 'hex'});
                waitlist_ret = bucket.add<number>(waitlist_address, 25);
            }
            const ret = bucket.get(waitlist_address);
            expect(ret.waitlist).toBe(true);
            expect(ret.data).toBe(25);
            bucket = getBucketByID(ret.bucketID, bucket);
            const second_in_waitlist = bucket.waitlist[1];
            setTimeout(() => {
                const ret = bucket.update(second_in_waitlist);
                if (ret !== KBKUpdateReturn.UpdatedFromWaitlist) return done(new Error('Invalid returned value'));
                return done((bucket.waitlist[0] === second_in_waitlist) ? undefined : new Error('Invalid peer in head of list'));
            }, 1000);

        });

        test('Update non existing peer in non empty bucket', () => {
            const bucket = create('0x0000000000000000000000000000000000000000');
            bucket.add<number>('0x0000000000000000000000000000000000000005', 12);
            const ret = bucket.update('0x0000000000000000000000000000000000000004');
            expect(ret).toBe(KBKUpdateReturn.NotFound);
        });

    });

    describe('getNearest', () => {

        test('Get Unique Nearest', () => {

            const bucket = create('0x0000000000000000000000000000000000000000');
            for (let idx = 0; idx < 1000; ++idx) {
                bucket.add<void>('0x' + RandomString.generate({length: 40, charset: 'hex'}), void 0);
            }

            let result = bucket.getNearest('0x0000000000000000000000000000000000000000', 10)
                .map((e: string) => parseInt(e, 16));
            let elem = result[0];
            for (const near of result) {
                expect(elem).toBeLessThanOrEqual(near);
                elem = near;
            }

            result = bucket.getNearest('0xffffffffffffffffffffffffffffffffffffffff', 10)
                .map((e: string) => parseInt(e, 16));
            elem = result[0];
            for (const near of result) {
                expect(elem).toBeGreaterThanOrEqual(near);
                elem = near;
            }

        });

    });
});
