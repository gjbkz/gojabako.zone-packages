import {removeHtmlComments} from './removeHtmlComments.private';

test('remove normal comment', () => {
    const source = [
        'a<!-- b -->c<!-- d -->',
        '<!-- e -->f',
    ].join('\n');
    const expected = 'ac\nf';
    expect(removeHtmlComments(source)).toBe(expected);
});

test('remove multiline comment', () => {
    const source = [
        'a<!--',
        ' b ',
        '-->c<!-- d',
        ' -->',
        '<!-- e -->f',
    ].join('\n');
    const expected = 'ac\nf';
    expect(removeHtmlComments(source)).toBe(expected);
});

test('remove multiline comment with <>', () => {
    const source = [
        'a<!--',
        ' b ',
        '-->>c<<!-- <d>',
        ' -->',
        '<!-- e -->f',
    ].join('\n');
    const expected = 'a>c<\nf';
    expect(removeHtmlComments(source)).toBe(expected);
});

test('remove IE conditional', () => {
    const source = [
        'a<!--[if !(IE 8) ]><!-->',
        'b',
    ].join('\n');
    const expected = 'a\nb';
    expect(removeHtmlComments(source)).toBe(expected);
});
