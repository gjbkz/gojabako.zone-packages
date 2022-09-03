import * as path from 'path';
import {listFiles} from '@gjbkz/gojabako.zone-node-util';
import {findPageMetaData} from './findPageMetaData';

const isPageFile = (filePath: string) => !filePath.endsWith('.component.tsx')
&& !filePath.endsWith('.css.ts')
&& !path.basename(filePath).startsWith('_')
&& ((/\.tsx?$/).test(filePath) || filePath.endsWith('.page.md'));

export interface ListPageMetaDataProps {
    rootDirectory: string,
    pagesDirectory: string,
}

export const listPageMetaData = async function* (props: ListPageMetaDataProps) {
    for await (const absolutePath of listFiles(props.pagesDirectory)) {
        if (isPageFile(absolutePath)) {
            const pageMetaData = await findPageMetaData({
                ...props,
                absolutePath,
            });
            if (pageMetaData) {
                yield pageMetaData;
            }
        }
    }
};
