import {serializeStyle} from './serializeStyle';

test('should parse CSS', () => {
    expect(
        [...serializeStyle('margin-block-start:1rem')].join(''),
    ).toBe('{marginBlockStart:\'1rem\'}');
});
