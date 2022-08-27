import type {HtmlAstNode} from './serializeHtmlAstNode';
import {serializeHtmlAstNode} from './serializeHtmlAstNode';

describe(serializeHtmlAstNode.name, () => {
    it('serialize', () => {
        const input: HtmlAstNode = {
            tag: 'p',
            attributes: {class: '123'},
            children: [
                {tag: 'span', attributes: {}, children: ['hello']},
                {tag: 'br', attributes: {}, children: []},
                'text',
            ],
        };
        const expected = '<p className="123"><span>hello</span><br/>text</p>';
        expect([...serializeHtmlAstNode(input, {jsx: true})].join('')).toBe(expected);
    });
    it('boolean attributes', () => {
        const input: HtmlAstNode = {
            tag: 'iframe',
            attributes: {
                src: 'https://example.com',
                allowfullscreen: '',
            },
            children: [],
        };
        const expected = '<iframe src="https://example.com" allowFullScreen=""/>';
        expect([...serializeHtmlAstNode(input, {jsx: true})].join('')).toBe(expected);
    });
});
