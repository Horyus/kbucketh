declare var describe;
declare var test;
declare var expect;

import { serialize, deserialize, distance, bitDistance } from './Utility';
import * as RandomString from 'randomstring';
import * as _ from 'lodash';

const valid_address_with_prefix = '0x9Da2FbFf722be805ce3618CFDeF731d50aDBcB27';
const valid_address_without_prefix = '9Da2FbFf722be805ce3618CFDeF731d50aDBcB27';
const valid_address_with_prefix_lowercase = '0x9Da2FbFf722be805ce3618CFDeF731d50aDBcB27'.toLowerCase();
const valid_address_without_prefix_lowercase = '9Da2FbFf722be805ce3618CFDeF731d50aDBcB27'.toLowerCase();

const valid_buffer_address = new Buffer('9Da2FbFf722be805ce3618CFDeF731d50aDBcB27', 'hex');

const invalid_address = '0x9Da2FbFf722be805ce3618CFDeF731d50aDBcB27ff';

type Done = (arg?: any) => void;

describe('Utility Test Suite', () => {

    describe('serialize', () => {

        test('Testing valid addresses', () => {

            const initial = serialize(valid_address_with_prefix);
            expect(_.isEqual(serialize(valid_address_without_prefix), initial)).toBe(true);
            expect(_.isEqual(serialize(valid_address_with_prefix_lowercase), initial)).toBe(true);
            expect(_.isEqual(serialize(valid_address_without_prefix_lowercase), initial)).toBe(true);
            expect(_.isEqual(serialize(valid_buffer_address), initial)).toBe(true);

        });

        test('Testing invalid address', (done: Done) => {

            try {
                serialize(invalid_address);
                done(new Error('Should have thrown'));
            } catch (e) {
                done();
            }

        });

    });

    describe('deserialize', () => {

        test('Testing valid addresses', () => {

            expect(deserialize(serialize(valid_address_with_prefix))).toBe(valid_address_with_prefix);
            expect(deserialize(serialize(valid_address_without_prefix))).toBe(valid_address_with_prefix);
            expect(deserialize(serialize(valid_address_with_prefix_lowercase))).toBe(valid_address_with_prefix);
            expect(deserialize(serialize(valid_address_without_prefix_lowercase))).toBe(valid_address_with_prefix);
            expect(deserialize(serialize(valid_buffer_address))).toBe(valid_address_with_prefix);

        });

        test('Testing invalid address', (done: Done) => {

            try {
                deserialize(serialize(valid_address_with_prefix).slice(2));
                done(new Error('Should have thrown'));
            } catch (e) {
                done();
            }

        });

    });

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

    describe('distance', () => {

        test('Testing same address', () => {

            expect(distance(ids[0], ids[0])).toBe(0);

        });

        test('Testing different address', () => {

            expect(distance(ids[0], ids[1])).not.toBe(0);

        });

        test('Testing highest and lowest', () => {

            expect(distance(ids[10], ids[11])).not.toBe(0);

        });

    });

    describe('bitDistance', () => {

        test('Testing different addresses', () => {
            expect(bitDistance(ids[10], ids[12])).toBe(159);
            expect(bitDistance(ids[10], ids[13])).toBe(151);
            expect(bitDistance(ids[10], ids[14])).toBe(119);
        });

        test('Testing same address', () => {
            expect(bitDistance(ids[0], ids[0])).toBe(160);
            expect(bitDistance(ids[10], ids[10])).toBe(160);
            expect(bitDistance(ids[11], ids[11])).toBe(160);
            expect(bitDistance(ids[15], ids[15])).toBe(160);
        });

    });

});
