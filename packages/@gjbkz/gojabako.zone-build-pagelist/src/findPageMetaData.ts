import {getPageTitle, getPagePathName} from '@gjbkz/gojabako.zone-markdown-util';
import {getFileData} from '@gjbkz/gojabako.zone-node-util';
import {loadPageMetaDataPatch} from './loadPageMetaDataPatch';

export interface PageMetaData {
    pathname: string,
    title: string,
    filePath: string,
    updatedAt: string,
    publishedAt: string,
    commitCount: number,
    description?: string,
}

export interface FindPageMetaDataProps {
    absolutePath: string,
    pagesDirectory: string,
}

export const findPageMetaData = async (
    props: FindPageMetaDataProps,
): Promise<PageMetaData | null> => {
    const pathname = getPagePathName(props);
    if (pathname.startsWith('/api/')) {
        return null;
    }
    const [
        title,
        {filePath, firstCommitAt, lastCommitAt, commitCount},
        patch,
    ] = await Promise.all([
        getPageTitle(props.absolutePath),
        getFileData(props.absolutePath),
        loadPageMetaDataPatch(props.absolutePath),
    ]);
    const publishedAt = firstCommitAt;
    const updatedAt = lastCommitAt;
    return {pathname, title, filePath, publishedAt, updatedAt, commitCount, ...patch};
};
