// https://github.com/syntax-tree/mdast
import type Markdown from 'mdast';
import * as esbuild from 'esbuild';
import {executeRegExp} from './executeRegExp.private';
import {detectEmbedding, supportedEmbeddingType} from './detectEmbedding';
import type {Attributes} from './serializeAttributes';
import {serializeAttributes} from './serializeAttributes';
import {serializeCodeToJsx} from './serializeCodeToJsx';
import {getTextContent} from './TextContent.private';
import {serializeTeXToJsx} from './serializeTeXToJsx';
import {toJsxSafeString} from './toJsxSafeString';

const generateImageLocalName = (
    context: SerializeMarkdownContext,
    node: {url: string},
): string => {
    const localName = `Image${context.images.size}`;
    context.images.set(localName, node.url);
    return localName;
};

type FilterContent<C extends Markdown.Content, T extends Markdown.Content['type']> = C extends {type: T} ? C : never;
export type MarkdownContent<T extends Markdown.Content['type']> = FilterContent<Markdown.Content, T>;
export interface SerializeMarkdownContext {
    getId: (namespace: string) => number,
    parseMarkdown: (source: string) => Markdown.Root,
    nodeListOf: <T extends Markdown.Content['type']>(type: T) => Array<MarkdownContent<T>>,
    findDefinition: (id: string) => Markdown.Definition | null,
    transformLink?: (href: string) => string,
    links: Set<string>,
    components: Set<string>,
    images: Map<string, string>,
    head: Set<string>,
}

export const serializeMarkdownToJsx = function* (
    context: SerializeMarkdownContext,
    source: string,
) {
    const node = context.parseMarkdown(source);
    yield* serialize(context, node, []);
};

export const serializeMarkdownRootToJsx = (
    context: SerializeMarkdownContext,
    root: Markdown.Root,
) => serialize(context, root, []);

export const serializeFootnotes = function* (
    context: SerializeMarkdownContext,
) {
    const footnotes = context.nodeListOf('footnoteDefinition');
    if (footnotes.length === 0) {
        return;
    }
    yield '<aside><dl className="footnotes">';
    for (const footnote of footnotes) {
        yield '<dt>';
        yield `<span className="anchor" id="footnote-${footnote.identifier}"/>`;
        yield `<a className="footnoteId" href="#footnoteRef-${footnote.identifier}">[${footnote.identifier}]</a>`;
        yield '</dt>';
        yield* serializeElement(context, 'dd', null, footnote, []);
    }
    yield '</dl></aside>';
};

// eslint-disable-next-line max-lines-per-function, complexity
const serialize = function* (
    context: SerializeMarkdownContext,
    node: Markdown.Content | Markdown.Root,
    ancestors: Array<Markdown.Content | Markdown.Root>,
): Generator<string> {
    const nextAncestors = [node, ...ancestors];
    switch (node.type) {
    case 'root':
        // console.info(JSON.stringify(node, null, 2));
        yield '<>';
        yield* serializeChildren(context, node, nextAncestors);
        yield '</>';
        break;
    case 'paragraph': {
        const {children} = node;
        if (children.every(({type}) => type === 'image')) {
            yield* serializeChildren(context, node, nextAncestors);
        } else {
            yield* serializeElement(context, 'p', null, node, nextAncestors);
        }
        break;
    }
    case 'heading': {
        const id = toJsxSafeString(getTextContent(node).toLowerCase().replace(/\s+/, '_'));
        yield `<h${node.depth}>`;
        if (1 < node.depth) {
            yield `<span className="anchor" id="${id}"/>`;
        }
        yield* serializeChildren(context, node, nextAncestors);
        if (1 < node.depth) {
            yield `&nbsp;<a className="link" href="#${id}" title="#${id}">#link</a>`;
        }
        yield `</h${node.depth}>`;
        break;
    }
    case 'thematicBreak':
        yield '<hr/>';
        break;
    case 'blockquote':
        yield* serializeElement(context, 'blockquote', null, node, nextAncestors);
        break;
    case 'list':
        yield* serializeElement(context, node.ordered ? 'ol' : 'ul', null, node, nextAncestors);
        break;
    case 'listItem':
        if (typeof node.checked === 'boolean') {
            yield '<li data-checkbox="">';
            yield `<input type="checkbox" readOnly={true} checked={${node.checked}}/>`;
        } else {
            yield '<li>';
        }
        yield* serializeChildren(context, node, nextAncestors);
        yield '</li>';
        break;
    case 'table': {
        yield `<figure id="figure-${context.getId('figure')}">`;
        yield `<table id="table-${context.getId('table')}">`;
        const aligns = node.align || [];
        const [first, ...rows] = node.children;
        yield '<thead>';
        yield* serializeTableRow(context, 'th', aligns, first, nextAncestors);
        yield '</thead>';
        yield '<tbody>';
        for (const row of rows) {
            yield* serializeTableRow(context, 'td', aligns, row, nextAncestors);
        }
        yield '</tbody>';
        yield '</table>';
        yield '</figure>';
        break;
    }
    case 'html':
        yield node.value;
        break;
    case 'code':
        yield* serializeCodeBlock(context, node, nextAncestors);
        break;
    case 'definition':
        break;
    case 'text':
        for (const matched of executeRegExp(node.value, /\${2}([^$]+)\${2}/g)) {
            if (typeof matched === 'string') {
                yield toJsxSafeString(matched);
            } else {
                yield '<span className="katex-inline">';
                const source = matched[1];
                yield* serializeTeXToJsx(source, {displayMode: false});
                yield '<span className="katex-source">$$';
                yield toJsxSafeString(source);
                yield '$$</span>';
                yield '</span>';
            }
        }
        break;
    case 'emphasis':
        yield* serializeElement(context, 'i', null, node, nextAncestors);
        break;
    case 'strong':
        yield* serializeElement(context, 'b', null, node, nextAncestors);
        break;
    case 'delete':
        yield* serializeElement(context, 's', null, node, nextAncestors);
        break;
    case 'inlineCode':
        yield `<code>${toJsxSafeString(node.value)}</code>`;
        break;
    case 'break':
        yield '<br/>';
        break;
    case 'link':
        yield* serializeLinkElement(context, {href: node.url}, node, nextAncestors);
        break;
    case 'image': {
        const isNotInLink = ancestors.every(({type}) => type !== 'link' && type !== 'linkReference');
        if (isNotInLink) {
            yield `<figure id="figure-${context.getId('figure')}">`;
        }
        const localName = generateImageLocalName(context, node);
        yield `<${localName} id="image-${context.getId('image')}" alt="${node.alt}" placeholder="blur" loading="lazy"/>`;
        if (isNotInLink) {
            if (node.alt) {
                yield `<figcaption>${node.alt}</figcaption>`;
            }
            yield '</figure>';
        }
        break;
    }
    case 'linkReference': {
        const definition = context.findDefinition(node.identifier);
        yield* serializeLinkElement(context, {href: definition && definition.url}, node, nextAncestors);
        break;
    }
    case 'imageReference': {
        const definition = context.findDefinition(node.identifier);
        if (definition) {
            const image: Markdown.Image = {...node, ...definition, type: 'image'};
            yield* serialize(context, image, nextAncestors);
        }
        break;
    }
    case 'footnoteReference':
        yield `<sup data-footnote="${node.identifier}">`;
        yield `<span className="anchor" id="footnoteRef-${node.identifier}"/>`;
        yield `<a className="footnoteId" href="#footnote-${node.identifier}">[${node.identifier}]</a>`;
        yield '</sup>';
        break;
    case 'footnoteDefinition':
        break;
    case 'footnote':
    case 'tableRow':
    case 'tableCell':
    case 'yaml':
    default:
        throw new Error(`UnsupportedType: ${JSON.stringify(node, null, 2)}`);
    }
};

const serializeChildren = function* (
    context: SerializeMarkdownContext,
    {children}: {children: Array<Markdown.Content>},
    nextAncestors: Array<Markdown.Content | Markdown.Root>,
) {
    for (const node of children) {
        yield* serialize(context, node, nextAncestors);
    }
};

const serializeElement = function* (
    context: SerializeMarkdownContext,
    tag: string,
    attrs: Attributes | null,
    node: {children: Array<Markdown.Content>},
    nextAncestors: Array<Markdown.Content | Markdown.Root>,
) {
    yield `<${tag}`;
    yield* serializeAttributes(attrs, {jsx: true});
    yield '>';
    yield* serializeChildren(context, node, nextAncestors);
    yield `</${tag}>`;
};

const serializeLinkElement = function* (
    context: SerializeMarkdownContext,
    {href, ...attrs}: Attributes,
    node: {children: Array<Markdown.Content>},
    nextAncestors: Array<Markdown.Content | Markdown.Root>,
) {
    if (typeof href !== 'string') {
        throw new Error(`Invalid href: ${href}`);
    }
    if (href.startsWith('/') || href.startsWith('.')) {
        href = context.transformLink ? context.transformLink(href) : href;
        context.links.add(href);
        yield '<Link';
        yield* serializeAttributes({href}, {jsx: true});
        yield '>';
        yield* serializeElement(context, 'a', attrs, node, nextAncestors);
        yield '</Link>';
    } else {
        context.links.add(href);
        yield* serializeElement(context, 'a', {href, ...attrs}, node, nextAncestors);
    }
};

const serializeTableRow = function* (
    context: SerializeMarkdownContext,
    cellTag: string,
    aligns: Array<Markdown.AlignType>,
    row: Markdown.TableRow,
    nextAncestors: Array<Markdown.Content | Markdown.Root>,
) {
    yield '<tr>';
    let columnIndex = 0;
    for (const cell of row.children) {
        const align = aligns[columnIndex] || null;
        yield* serializeElement(
            context,
            cellTag,
            {align},
            cell,
            [cell, row, ...nextAncestors],
        );
        columnIndex += 1;
    }
    yield '</tr>';
};

const serializeCodeBlock = function* (
    context: SerializeMarkdownContext,
    node: Markdown.Code,
    nextAncestors: Array<Markdown.Content | Markdown.Root>,
) {
    if (supportedEmbeddingType.has(`${node.lang}`)) {
        yield* serializeEmbedding(context, node);
    } else if (node.lang === 'jsx' && node.meta === '(include)') {
        yield node.value;
    } else if (node.lang === 'tsx' && node.meta === '(include)') {
        yield esbuild.transformSync(`() => <>${node.value}</>`, {
            loader: 'tsx',
            format: 'esm',
            jsx: 'preserve',
        }).code.replace(/\s*\(\s*\)\s*=>\s*<>(.*)<\/>\s*;?\s*$/, '$1');
    } else if (node.lang === 'typescript' && node.meta === '(include)') {
        context.head.add(esbuild.transformSync(node.value, {
            loader: 'ts',
            format: 'esm',
            jsx: 'preserve',
        }).code);
    } else {
        yield `<figure id="figure-${context.getId('figure')}" data-lang="${node.lang || ''}">`;
        if (node.meta) {
            const {children: [caption]} = context.parseMarkdown(node.meta);
            if ('children' in caption) {
                yield* serializeElement(context, 'figcaption', null, caption, nextAncestors);
            }
        }
        switch (node.lang) {
        case 'math':
            yield* serializeTeXToJsx(node.value, {displayMode: true});
            yield '<span className="katex-source">{';
            yield JSON.stringify(`\n${node.value}\n`);
            yield '}</span>';
            break;
        default:
            yield* serializeCodeToJsx(node.lang, node.value);
        }
        yield '</figure>';
    }
};

const serializeEmbedding = function* (
    context: SerializeMarkdownContext,
    node: Markdown.Code,
) {
    const embedding = detectEmbedding(node.value);
    if (!embedding) {
        throw new Error(`NoServicesDetected: ${node.value}`);
    }
    if (embedding.type !== node.lang) {
        throw new Error(`UnmatchedService: You requested ${node.lang} but ${embedding.type} was detected.`);
    }
    context.components.add('ui/Embed');
    yield `<Embed type="${embedding.type}">${embedding.jsx}</Embed>`;
};
