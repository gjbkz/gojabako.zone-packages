import * as fs from 'fs';
import {fromMarkdown} from 'mdast-util-from-markdown';
import {walkMarkdownContentNodes} from '@gjbkz/gojabako.zone-markdown-parser';
import {getTextContent} from './getTextContent';

export const getPageTitle = async (pageFileAbsolutePath: string): Promise<string> => {
    const code = await fs.promises.readFile(pageFileAbsolutePath, 'utf8');
    const ext = pageFileAbsolutePath.slice(pageFileAbsolutePath.lastIndexOf('.'));
    switch (ext) {
    case '.md':
        return getTitleFromMarkdown(code);
    case '.tsx':
        return getTitleFromJsx(code);
    default:
        throw new Error(`UnsupportedFile: ${pageFileAbsolutePath}`);
    }
};

const getTitleFromMarkdown = (code: string) => {
    for (const node of walkMarkdownContentNodes(...fromMarkdown(code).children)) {
        if (node.type === 'heading' && node.depth === 1) {
            return getTextContent(node);
        }
    }
    return '';
};

const getTitleFromJsx = (code: string): string => {
    const titleTag = (/<title[^>]*?>([^<]*?)<\/title[^>]*?>/).exec(code);
    if (titleTag) {
        return titleTag[1];
    }
    return '';
};
