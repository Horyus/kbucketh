declare var describe;
declare var test;
declare var expect;

import { KBucketh } from './KBucketh';

describe('Dummy Test Suite', () => {

    test('Testing KBucketh', () => {
        const instance = new KBucketh();
        expect(instance.test()).toBe('test');
    });

});
