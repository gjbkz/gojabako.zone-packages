import type {SerializeAttributeOptions} from './serializeAttributes';
import type {HtmlAstNode} from './serializeHtmlAstNode';
import {serializeHtmlAstNode} from './serializeHtmlAstNode';

export class HtmlParserContext {

    protected readonly stack: Array<HtmlAstNode> = [];

    protected readonly root: Array<HtmlAstNode> = [];

    protected get currentElement() {
        return this.stack[0] as HtmlAstNode | undefined;
    }

    public *serialize(option: SerializeAttributeOptions): Generator<string> {
        for (const node of this.root) {
            yield* serializeHtmlAstNode(node, option);
        }
    }

    protected enter(element: HtmlAstNode) {
        const {currentElement} = this;
        if (currentElement) {
            currentElement.children.push(element);
        } else {
            this.root.push(element);
        }
        this.stack.unshift(element);
    }

    public onopentag(tag: string, attributes: Record<string, string>) {
        this.enter({tag, attributes, children: []});
    }

    public ontext(text: string) {
        const {currentElement} = this;
        if (currentElement) {
            currentElement.children.push(text);
        } else if (text.trim()) {
            throw new Error(`NoElementToAppend: ${JSON.stringify(text)}`);
        }
    }

    public onclosetag(tag: string) {
        const element = this.stack.shift();
        if (!element) {
            throw new Error(`UnexpectedClosing: ${tag}`);
        }
        if (tag !== element.tag) {
            throw new Error(`UnmatchedTag: closing ${tag} but the context is ${element.tag}`);
        }
    }

}
