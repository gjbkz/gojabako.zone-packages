/* eslint-disable @typescript-eslint/no-invalid-this */
import * as path from 'path';
import * as console from 'console';
import type {LoaderDefinitionFunction} from 'webpack';
import type {TypeChecker} from '@nlib/typing';
import {createTypeChecker, ensure, isFunction, isString} from '@nlib/typing';
import {createSerializeMarkdownContext, serializeMarkdownToJsx} from '@gjbkz/gojabako.zone-markdown-parser';
import {getPagePathName, finalizeSerializeMarkdownContext} from '@gjbkz/gojabako.zone-markdown-util';

const isLoaderOptions = createTypeChecker('LoaderOptions', {
    pagesDirectory: isString,
    getComponentPath: isFunction as TypeChecker<(componentName: string) => string>,
});

const markdownComponentLoader: LoaderDefinitionFunction = function (content) {
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
        return getPagePathName({absolutePath: file, pagesDirectory});
    };
    const context = createSerializeMarkdownContext({transformLink});
    const jsx = [...serializeMarkdownToJsx(context, content)].join('');
    const {head, foot} = finalizeSerializeMarkdownContext(context, {
        file: resourcePath,
        getComponentPath,
    });
    return [
        head,
        `export default function Markdown(props) {return <>${jsx}${foot}</>}`,
    ].join('\n');
};

// eslint-disable-next-line import/no-default-export
export default markdownComponentLoader;
