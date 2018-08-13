declare var describe;
declare var test;
declare var expect;

import { serialize, deserialize } from './Utility';
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

        test('Testing invalid addresse', (done: Done) => {
            try {
                deserialize(serialize(valid_address_with_prefix).slice(2));
                done(new Error('Should have thrown'));
            } catch (e) {
                done();
            }
        });

    });
});
