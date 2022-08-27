import {toJsxSafeString} from './toJsxSafeString';
import type {SerializeAttributeOptions} from './serializeAttributes';
import {serializeAttributes} from './serializeAttributes';

export interface HtmlAstNode<T extends string = string> {
    tag: T,
    attributes: Record<string, string>,
    children: Array<HtmlAstNode | string>,
}

export const serializeHtmlAstNode = function* (
    node: HtmlAstNode | string,
    option: SerializeAttributeOptions,
): Generator<string> {
    if (typeof node === 'string') {
        yield toJsxSafeString(node);
        return;
    }
    const {tag, attributes, children} = node;
    yield `<${tag}`;
    yield* serializeAttributes(attributes, option);
    if (0 < children.length) {
        yield '>';
        for (const child of children) {
            yield* serializeHtmlAstNode(child, option);
        }
        yield `</${tag}>`;
    } else {
        yield '/>';
    }
};

