import type {Root} from 'lowlight/lib/core';
import {serializeLowlightToJsx} from './serializeLowlightToJsx';

test('serialize ts', () => {
    const input: Root = {
        type: 'root',
        data: {language: 'typescript', relevance: 3},
        children: [
            {
                type: 'element',
                tagName: 'span',
                properties: {className: ['hljs-keyword']},
                children: [{type: 'text', value: 'const'}],
            },
            {type: 'text', value: ' foo = '},
            {
                type: 'element',
                tagName: 'span',
                properties: {className: ['hljs-string']},
                children: [{type: 'text', value: '"aaa"'}],
            },
            {type: 'text', value: ';\n'},
            {
                type: 'element',
                tagName: 'span',
                properties: {className: ['hljs-keyword']},
                children: [{type: 'text', value: 'const'}],
            },
            {type: 'text', value: ' bar = '},
            {
                type: 'element',
                tagName: 'span',
                properties: {className: ['hljs-number']},
                children: [{type: 'text', value: '123'}],
            },
            {type: 'text', value: ';'},
        ],
    };
    const expected = [
        '<ol data-lang="typescript">',
        '<li><code>',
        '<span className="hljs-keyword">const</span>',
        ' foo = ',
        '<span className="hljs-string">&#34;aaa&#34;</span>',
        ';',
        '</code></li>',
        '<li><code>',
        '<span className="hljs-keyword">const</span>',
        ' bar = ',
        '<span className="hljs-number">123</span>',
        ';',
        '</code></li>',
        '</ol>',
    ].join('');
    expect([...serializeLowlightToJsx(input)].join('')).toBe(expected);
});

test('serialize multiline text', () => {
    const input: Root = {
        type: 'root',
        data: {language: 'markdown', relevance: 3},
        children: [
            {
                type: 'element',
                tagName: 'span',
                properties: {className: ['hljs-section']},
                children: [
                    {
                        type: 'text',
                        value: 'heading\n=================',
                    },
                ],
            },
            {
                type: 'text',
                value: '\n\n',
            },
            {
                type: 'element',
                tagName: 'span',
                properties: {className: ['hljs-section']},
                children: [
                    {
                        type: 'text',
                        value: '### heading3',
                    },
                ],
            },
        ],
    };
    const expected = [
        '<ol data-lang="markdown">',
        '<li><code>',
        '<span className="hljs-section">heading</span>',
        '</code></li>',
        '<li><code>',
        '<span className="hljs-section">=================</span>',
        '</code></li>',
        '<li><code></code></li>',
        '<li><code>',
        '<span className="hljs-section">### heading3</span>',
        '</code></li>',
        '</ol>',
    ].join('');
    expect([...serializeLowlightToJsx(input)].join('')).toBe(expected);
});

test('throw at unknown node', () => {
    const input: Root = {
        type: 'root',
        data: {language: 'typescript', relevance: 3},
        children: [
            {
                type: '_' as 'element',
                tagName: 'span',
                properties: {className: ['hljs-keyword']},
                children: [{type: 'text', value: 'const'}],
            },
        ],
    };
    expect(() => {
        [...serializeLowlightToJsx(input)].slice();
    }).toThrow(/^UnsupportedType:/);
});
