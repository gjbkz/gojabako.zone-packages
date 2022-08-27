import * as path from 'path';
import type {SerializeMarkdownContext} from '@gjbkz/gojabako.zone-markdown-parser';
import {serializeFootnotes} from '@gjbkz/gojabako.zone-markdown-parser';
import {getRelativePath} from './getRelativePath';

interface Props {
    file: string,
    getComponentPath: (componentName: string) => string,
}

export const finalizeSerializeMarkdownContext = (
    context: SerializeMarkdownContext,
    props: Props,
) => {
    const foot = [...serializeFootnotes(context)].join('');
    const head = [...serializeHead(context, props)].join('\n');
    return {head, foot};
};

const serializeHead = function* (
    {links, images, components, head}: SerializeMarkdownContext,
    {file, getComponentPath}: Props,
): Generator<string> {
    for (const href of links) {
        if (href.startsWith('/') || href.startsWith('.')) {
            yield 'import Link from \'next/link\';';
            break;
        }
    }
    for (const [localName, from] of images) {
        yield `import ${localName} from '${from}.component';`;
    }
    for (const component of components) {
        const componentPath = getComponentPath(component);
        const pageDir = path.dirname(file);
        const relativePath = getRelativePath(pageDir, componentPath);
        yield `import {${component.split('/').pop()}} from '${relativePath}';`;
    }
    for (const line of head) {
        yield line;
    }
};
