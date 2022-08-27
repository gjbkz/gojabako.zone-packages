import type {KatexOptions} from 'katex';
import katex from 'katex';
import {Parser as HTMLParser} from 'htmlparser2';
import {HtmlParserContext} from './HtmlParserContext';

export const serializeTeXToJsx = function* (
    source: string,
    options?: KatexOptions,
): Generator<string> {
    if (!source) {
        return;
    }
    const ctx = new HtmlParserContext();
    const parser = new HTMLParser(ctx);
    parser.write(
        katex.renderToString(
            `\\displaystyle ${source}`,
            {
                output: 'html',
                ...options,
            },
        )
        .replace(/[\r\n]/g, '')
        .replace(/^<span[^>]*katex-display[^>]*>(.*)<\/span>$/, '$1'),
    );
    parser.end();
    yield* ctx.serialize({jsx: true});
};
