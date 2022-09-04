import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {ImagePool} from '@squoosh/lib';
import {getHash} from '@gjbkz/gojabako.zone-node-util';
import {loadPreviousResult} from './loadPreviousResult';
import {processImage} from './processImage';
import {serializeImageComponentScript} from './serializeImageComponentScript';

const version = 1;
const resultFileName = 'result.json';

export interface BuildImagesProps {
    imageFiles: AsyncIterable<string> | Iterable<string>,
    rootDirectory: string,
    pagesDirectory: string,
    processedImageDirectory: string,
    publicDirectory: string,
}

export const buildImages = async (props: BuildImagesProps) => {
    for await (const absolutePath of props.imageFiles) {
        const {previous, outputDirectory} = await loadImage(absolutePath, props);
        const imagePool = new ImagePool(os.cpus().length);
        const result = previous || await processImage(imagePool, {
            ...props,
            absolutePath,
            outputDirectory,
        });
        await imagePool.close();
        const componentFilePath = `${absolutePath}.component.tsx`;
        const writer = fs.createWriteStream(componentFilePath);
        for (const line of serializeImageComponentScript(result)) {
            writer.write(`${line}\n`);
        }
        writer.end();
    }
};

const loadImage = async (
    absolutePath: string,
    props: BuildImagesProps,
) => {
    const relativePath = path.relative(props.pagesDirectory, absolutePath).split(path.sep).join('/');
    const hash = getHash(relativePath).toString('base64url').slice(0, 8);
    const outputDirectory = path.join(props.processedImageDirectory, hash);
    const previous = await loadPreviousResult({
        ...props,
        version,
        resultFileName,
        outputDirectory,
    });
    return {previous, outputDirectory};
};
