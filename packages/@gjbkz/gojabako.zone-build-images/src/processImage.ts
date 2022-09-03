import * as fs from 'fs';
import * as path from 'path';
import * as console from 'console';
import * as squoosh from '@squoosh/lib';
import {rmrf, getHash} from '@gjbkz/gojabako.zone-node-util';
import type {EncodeResult} from './isEncodeResult';
import {listImageWidthPatterns} from './listImageWidthPatterns';
import type {ImageData} from './isImageData';

const version = 1;
const resultFileName = 'result.json';

type SquooshImage = ReturnType<typeof squoosh.ImagePool.prototype.ingestImage>;
type SquooshEncodeOptions = Parameters<SquooshImage['encode']>[0];
interface Props {
    absolutePath: string,
    relativePath: string,
    rootDirectory: string,
    outputDirectory: string,
    publicDirectory: string,
}

export const processImage = async (imagePool: squoosh.ImagePool, props: Props) => {
    const [loaded] = await Promise.all([
        loadImage(imagePool, props),
        clearDirectory(props.outputDirectory),
    ]);
    let {image} = loaded;
    const result: EncodeResult = {version, source: loaded.source, results: []};
    for (const width of listImageWidthPatterns(loaded.source.width)) {
        const height = Math.round(loaded.source.height * width / loaded.source.width);
        await image.preprocess({resize: {width}});
        for (const encoded of Object.values(await image.encode(loaded.encodeOptions))) {
            const hash = getHash(encoded.binary).toString('base64url').slice(0, 8);
            const dest = path.join(props.outputDirectory, `w${width}.${hash}.${encoded.extension}`);
            await fs.promises.writeFile(dest, encoded.binary);
            console.info(`written: ${dest} (${encoded.size})`);
            result.results.push({
                path: [
                    '',
                    ...path.relative(props.publicDirectory, dest).split(path.sep),
                ].join('/'),
                hash: getHash(encoded.binary).toString('base64url'),
                width,
                height,
                size: encoded.size,
            });
        }
        image = imagePool.ingestImage(loaded.sourceBuffer);
    }
    const resultPath = path.join(props.outputDirectory, resultFileName);
    await fs.promises.writeFile(resultPath, JSON.stringify(result, null, 4));
    return result;
};

const clearDirectory = async (directoryPath: string) => {
    await rmrf(directoryPath);
    await fs.promises.mkdir(directoryPath, {recursive: true});
};

const loadImage = async (
    imagePool: squoosh.ImagePool,
    {absolutePath, rootDirectory}: {
        absolutePath: string,
        rootDirectory: string,
    },
) => {
    const sourceBuffer = await fs.promises.readFile(absolutePath);
    const image = imagePool.ingestImage(sourceBuffer);
    const encodeOptions = getEncodeOptions(absolutePath);
    const {bitmap} = await image.decoded;
    const source: ImageData = {
        path: ['', ...path.relative(rootDirectory, absolutePath).split(path.sep)].join('/'),
        hash: getHash(sourceBuffer).toString('base64url'),
        width: bitmap.width,
        height: bitmap.height,
        size: sourceBuffer.byteLength,
    };
    return {source, sourceBuffer, image, encodeOptions};
};

const getEncodeOptions = (sourceFileAbsolutePath: string): SquooshEncodeOptions => {
    const encodeOptions: SquooshEncodeOptions = {
        webp: {...squoosh.encoders.webp.defaultEncoderOptions},
        avif: {...squoosh.encoders.avif.defaultEncoderOptions},
    };
    switch (path.extname(sourceFileAbsolutePath)) {
    case '.png':
        encodeOptions.oxipng = {...squoosh.encoders.oxipng.defaultEncoderOptions};
        break;
    default:
        encodeOptions.mozjpeg = {...squoosh.encoders.mozjpeg.defaultEncoderOptions};
    }
    return encodeOptions;
};
