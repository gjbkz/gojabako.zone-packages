import {toJsxSafeString} from './toJsxSafeString';

test('should convert some characters', () => {
    const input = '<p>{\'text\'}</p>';
    const expected = '&#60;p&#62;&#123;&#39;text&#39;&#125;&#60;/p&#62;';
    expect(toJsxSafeString(input)).toBe(expected);
});
