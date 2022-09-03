import * as fs from 'fs';
import {isHttpsUrlString, isObject, isString} from '@nlib/typing';
import {ignoreENOENT} from './ignoreENOENT';
import {isDateString} from './isDateString';

export interface PageMetaDataPatch {
    title?: string,
    archiveOf?: string,
    publishedAt?: string,
    description?: string,
}

export const loadPageMetaDataPatch = async (pageFileAbsolutePath: string): Promise<Partial<PageMetaDataPatch>> => {
    const result: Partial<PageMetaDataPatch> = {};
    const patchFilePath = `${pageFileAbsolutePath}.json`;
    const jsonString = await fs.promises.readFile(patchFilePath, 'utf-8').catch(ignoreENOENT);
    if (jsonString) {
        const parsed: unknown = JSON.parse(jsonString);
        if (isObject(parsed)) {
            const {publishedAt, archiveOf, title, description} = parsed;
            if (isString(title) && title) {
                result.title = title;
            }
            if (isDateString(publishedAt)) {
                result.publishedAt = publishedAt;
            }
            if (isHttpsUrlString(archiveOf)) {
                result.archiveOf = archiveOf;
            }
            if (isString(description) && description) {
                result.description = description;
            }
        }
    }
    return result;
};
