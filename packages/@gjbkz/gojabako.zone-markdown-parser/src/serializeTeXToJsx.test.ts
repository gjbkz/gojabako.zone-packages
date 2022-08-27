import {serializeTeXToJsx} from './serializeTeXToJsx';

test('should parse TeX', () => {
    const jsx = [...serializeTeXToJsx('x^{2}')].join('');
    const expected = '<span className="katex"><span className="katex-html"';
    expect(jsx.startsWith(expected)).toBe(true);
});
