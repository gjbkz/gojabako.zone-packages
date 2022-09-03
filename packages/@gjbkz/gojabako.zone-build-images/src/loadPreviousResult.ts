import * as fs from 'fs/promises';
import * as path from 'path';
import * as console from 'console';
import {ignoreENOENT} from '@gjbkz/gojabako.zone-node-util';
import {isEncodeResult} from './isEncodeResult';

interface Props {
    version: number,
    publicDirectory: string,
    outputDirectory: string,
    resultFileName: string,
}

export const loadPreviousResult = async (
    {version, publicDirectory, outputDirectory, resultFileName}: Props,
) => {
    const resultPath = path.join(outputDirectory, resultFileName);
    const json = await fs.readFile(resultPath, 'utf8').catch(ignoreENOENT);
    if (!json) {
        console.info(`NoResult: ${resultPath}`);
        return null;
    }
    const parsed: unknown = JSON.parse(json);
    if (isEncodeResult(parsed)) {
        if (parsed.version !== version) {
            console.info(`OldVersion: ${JSON.stringify(parsed.version, null, 4)}`);
            return null;
        }
        for (const result of parsed.results) {
            const filePath = path.join(publicDirectory, ...result.path.split('/'));
            const stats = await fs.stat(filePath).catch(ignoreENOENT);
            if (!stats || !stats.isFile() || stats.size !== result.size) {
                console.info(`FileChanged: ${JSON.stringify(result, null, 4)}`);
                return null;
            }
        }
        return parsed;
    }
    console.info(`UnknownFormat: ${JSON.stringify(parsed, null, 4)}`);
    return null;
};
