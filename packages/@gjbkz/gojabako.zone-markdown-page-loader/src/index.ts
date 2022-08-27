/* eslint-disable @typescript-eslint/no-invalid-this */
import * as path from 'path';
import * as console from 'console';
import type {LoaderDefinitionFunction} from 'webpack';
import type {TypeChecker} from '@nlib/typing';
import {createTypeChecker, ensure, isFunction, isString} from '@nlib/typing';
import {createSerializeMarkdownContext, getMarkdownExcerpt, serializeMarkdownRootToJsx} from '@gjbkz/gojabako.zone-markdown-parser';
import {getPagePathName, finalizeSerializeMarkdownContext} from '@gjbkz/gojabako.zone-markdown-util';

const isLoaderOptions = createTypeChecker('LoaderOptions', {
    pagesDirectory: isString,
    getComponentPath: isFunction as TypeChecker<(componentName: string) => string>,
});

const markdownPageLoader: LoaderDefinitionFunction = function (content) {
    const options = this.getOptions();
    if (!isLoaderOptions(options)) {
        const message = `BadOptions: ${JSON.stringify(options, null, 2)}`;
        console.error(message);
        ensure(options, isLoaderOptions);
        throw new Error(message);
    }
    const {pagesDirectory, getComponentPath} = options;
    const {resourcePath} = this;
    const baseDirectoryPath = path.dirname(resourcePath);
    const transformLink = (href: string) => {
        let file = href;
        if (!href.startsWith('/')) {
            file = `${baseDirectoryPath}/${href}`;
        }
        return getPagePathName({file, pagesDirectory});
    };
    const context = createSerializeMarkdownContext({transformLink});
    const root = context.parseMarkdown(content);
    const [titleNode, ...bodyNodes] = root.children;
    if (!(titleNode.type === 'heading' && titleNode.depth === 1)) {
        throw new Error(`The 1st node is not <h1>: ${JSON.stringify(titleNode, null, 4)}`);
    }
    root.children = bodyNodes;
    context.components.add('site/HtmlHead');
    context.components.add('site/PageTitle');
    const body = [...serializeMarkdownRootToJsx(context, root)].join('');
    const pathname = getPagePathName({file: resourcePath, pagesDirectory});
    const {head, foot} = finalizeSerializeMarkdownContext(context, {file: resourcePath, getComponentPath});
    const excerpt = getMarkdownExcerpt(200, ...bodyNodes);
    return `${head}
export default function MarkdownPage() {
    return <>
        <HtmlHead description=${JSON.stringify(excerpt)} pathname="${pathname}"/>
        <main>
            <article>
                <PageTitle pathname="${pathname}"/>
                ${body}
                ${foot}
            </article>
        </main>
    </>;
}`;
};

// eslint-disable-next-line import/no-default-export
export default markdownPageLoader;
