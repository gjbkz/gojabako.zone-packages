import * as path from 'path';

interface Props {
    /** absolute path to the source file */
    file: string,
    /** absolute path to the pages directory */
    pagesDirectory: string,
}

export const getPagePathName = ({file, pagesDirectory}: Props): string => {
    const normalizedFileAbsolutePath = path.normalize(file.split('/').join(path.sep));
    if (!normalizedFileAbsolutePath.startsWith(pagesDirectory)) {
        throw new Error(`The page file isn't in the pages directory: ${normalizedFileAbsolutePath}`);
    }
    if (path.basename(normalizedFileAbsolutePath).startsWith('_')) {
        throw new Error(`The page file starts with "_": ${normalizedFileAbsolutePath}`);
    }
    let result = path.relative(pagesDirectory, normalizedFileAbsolutePath);
    result = `/${result.split(path.sep).join('/')}`;
    result = result.replace(/\.\w+$/, '');
    if (result.endsWith('.page')) {
        result = result.slice(0, -5);
    }
    if (result.endsWith('/index')) {
        result = result.slice(0, -6);
    }
    return result;
};
