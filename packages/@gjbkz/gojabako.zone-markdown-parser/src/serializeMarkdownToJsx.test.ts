import {createSerializeMarkdownContext} from './createSerializeContext';
import {serializeMarkdownToJsx, serializeMarkdownRootToJsx, serializeFootnotes} from './serializeMarkdownToJsx';

test('heading', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        '# Title{1}',
        '## Title{2}',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = [
        '<>',
        '<h1>Title&#123;1&#125;</h1>',
        '<h2>',
        '<span className="anchor" id="title&#123;2&#125;"/>',
        'Title&#123;2&#125;',
        '&nbsp;',
        '<a className="link" href="#title&#123;2&#125;" title="#title&#123;2&#125;">#link</a>',
        '</h2>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('ol', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        '1. foo',
        '2. bar',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = [
        '<>',
        '<ol>',
        '<li><p>foo</p></li>',
        '<li><p>bar</p></li>',
        '</ol>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('ul', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        '- foo',
        '- bar',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = [
        '<>',
        '<ul>',
        '<li><p>foo</p></li>',
        '<li><p>bar</p></li>',
        '</ul>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('hr', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        'foo',
        '',
        '--------',
        '',
        'bar',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = [
        '<>',
        '<p>foo</p>',
        '<hr/>',
        '<p>bar</p>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('blockquote', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        'foo',
        '',
        '> bar',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = [
        '<>',
        '<p>foo</p>',
        '<blockquote>',
        '<p>bar</p>',
        '</blockquote>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('table', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        '| Cell11 | Cell12 | Cell13 |',
        '|--------|--------|--------|',
        '| Cell21 | Cell22 | Cell23 |',
        '| Cell31 | Cell32 | Cell33 |',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = [
        '<>',
        '<figure id="figure-1">',
        '<table id="table-1">',
        '<thead>',
        '<tr><th>Cell11</th><th>Cell12</th><th>Cell13</th></tr>',
        '</thead>',
        '<tbody>',
        '<tr><td>Cell21</td><td>Cell22</td><td>Cell23</td></tr>',
        '<tr><td>Cell31</td><td>Cell32</td><td>Cell33</td></tr>',
        '</tbody>',
        '</table>',
        '</figure>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('break', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        'foo\\',
        'bar  ',
        'baz',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = [
        '<>',
        '<p>foo<br/>bar<br/>baz</p>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('definition', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        'foo[bar1]baz[bar**2**][bar2]',
        '',
        '[bar1]: https://example.com/1',
        '[bar2]: https://example.com/2',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = [
        '<>',
        '<p>',
        'foo<a href="https://example.com/1">bar1</a>baz',
        '<a href="https://example.com/2">bar<b>2</b></a>',
        '</p>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('image', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        '![image1](./image1)',
        '',
        '[![image2]][image2]',
        '',
        '[image2]: ./image2',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = [
        '<>',
        '<figure id="figure-1">',
        '<Image0 id="image-1" alt="image1" placeholder="blur" loading="lazy"/>',
        '<figcaption>image1</figcaption>',
        '</figure>',
        '<p>',
        '<Link href="./image2"><a>',
        '<Image1 id="image-2" alt="image2" placeholder="blur" loading="lazy"/>',
        '</a></Link>',
        '</p>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('footnote', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        'Here is a simple footnote[^1].',
        '',
        '[^1]: My reference.',
    ].join('\n');
    const actual = [
        ...serializeMarkdownToJsx(context, source),
        ...serializeFootnotes(context),
    ].join('');
    const expected = [
        '<>',
        '<p>Here is a simple footnote<sup data-footnote="1">',
        '<span className="anchor" id="footnoteRef-1"/>',
        '<a className="footnoteId" href="#footnote-1">[1]</a>',
        '</sup>',
        '.',
        '</p>',
        '</>',
        '<aside>',
        '<dl className="footnotes">',
        '<dt>',
        '<span className="anchor" id="footnote-1"/>',
        '<a className="footnoteId" href="#footnoteRef-1">',
        '[1]',
        '</a>',
        '</dt>',
        '<dd>',
        '<p>My reference.</p>',
        '</dd>',
        '</dl>',
        '</aside>',
    ].join('');
    expect(actual).toBe(expected);
});

test('decoration', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        '*emphasis* **strong** ~~delete~~ `inline code`',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = [
        '<>',
        '<p>',
        '<i>emphasis</i> <b>strong</b> <s>delete</s> <code>inline code</code>',
        '</p>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('code with linked caption', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        '```markdown [sample.md](https://example.com)',
        '    hello.',
        '```',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = [
        '<>',
        '<figure id="figure-1" data-lang="markdown">',
        '<figcaption>',
        '<a href="https://example.com">sample.md</a>',
        '</figcaption>',
        '<ol data-lang="markdown">',
        '<li>',
        '<code><span className="hljs-code">    hello.</span></code>',
        '</li>',
        '</ol>',
        '</figure>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('code without lang', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        '```',
        '$ echo 123',
        '```',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = [
        '<>',
        '<figure id="figure-1" data-lang="">',
        '<ol data-lang="shell">',
        '<li>',
        '<code>',
        '<span className="hljs-meta prompt_">$ </span><span className="bash"><span className="hljs-built_in">echo</span> 123</span>',
        '</code>',
        '</li>',
        '</ol>',
        '</figure>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('heading from root', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        '# Title{1}',
        '## Title{2}',
    ].join('\n');
    const root = context.parseMarkdown(source);
    const actual = [...serializeMarkdownRootToJsx(context, root)].join('');
    const expected = [
        '<>',
        '<h1>Title&#123;1&#125;</h1>',
        '<h2>',
        '<span className="anchor" id="title&#123;2&#125;"/>',
        'Title&#123;2&#125;',
        '&nbsp;',
        '<a className="link" href="#title&#123;2&#125;" title="#title&#123;2&#125;">#link</a>',
        '</h2>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('jsx (import)', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        '```jsx (import)',
        'const f = () => <p>{\'Hello!\'}</p>',
        '```',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = '<></>';
    expect(actual).toBe(expected);
    expect([...context.head].join('\n').trim()).toBe([
        'const f = () => <p>{\'Hello!\'}</p>',
    ].join('\n'));
});

test('jsx (include)', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        '```jsx (include)',
        '<p>{\'Hello!\'}</p>',
        '```',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = [
        '<>',
        '<p>{\'Hello!\'}</p>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('tsx (include)', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        '```tsx (include)',
        '<button onClick={(e: unknown) => null}>text</button>',
        '```',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = [
        '<>',
        '<button onClick={(e) => null}>text</button>',
        '</>',
    ].join('');
    expect(actual).toBe(expected);
});

test('tsx (import)', () => {
    const context = createSerializeMarkdownContext();
    const source = [
        '```typescript (import)',
        'const fn = (a: number) => <code>{a + a}</code>;',
        '```',
    ].join('\n');
    const actual = [...serializeMarkdownToJsx(context, source)].join('');
    const expected = '<></>';
    expect(actual).toBe(expected);
    expect([...context.head].join('\n').trim()).toBe([
        'const fn = (a) => <code>{a + a}</code>;',
    ].join('\n'));
});
