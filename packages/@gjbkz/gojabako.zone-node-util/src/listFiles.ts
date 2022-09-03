import * as fs from 'fs/promises';
import * as path from 'path';

export const listFiles = async function* (...absoluteDirectoryPathList: Array<string>): AsyncGenerator<string> {
    for (const directoryPath of absoluteDirectoryPathList) {
        for await (const name of await fs.readdir(directoryPath)) {
            const fileAbsolutePath = path.join(directoryPath, name);
            const stats = await fs.stat(fileAbsolutePath);
            if (stats.isDirectory()) {
                yield* listFiles(path.join(directoryPath, name));
            } else if (stats.isFile()) {
                yield fileAbsolutePath;
            }
        }
    }
};
