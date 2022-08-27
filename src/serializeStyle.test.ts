import {serializeStyle} from './serializeStyle';

describe(serializeStyle.name, () => {
    it('should parse CSS', () => {
        expect(
            [...serializeStyle('margin-block-start:1rem')].join(''),
        ).toBe('{marginBlockStart:\'1rem\'}');
    });
});
