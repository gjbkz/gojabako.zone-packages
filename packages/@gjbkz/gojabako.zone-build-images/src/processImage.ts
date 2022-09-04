import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as console from 'console';
import type {EncoderOptions} from '@squoosh/lib';
import {rmrf, getHash} from '@gjbkz/gojabako.zone-node-util';
import type {EncodeResult} from './isEncodeResult';
import {listImageWidthPatterns} from './listImageWidthPatterns';
import type {ImageData} from './isImageData';

const version = 1;
const resultFileName = 'result.json';

interface SquooshEncodeOptions extends EncoderOptions {
    optimizerButteraugliTarget?: number,
    maxOptimizerRounds?: number,
}
interface Props {
    absolutePath: string,
    rootDirectory: string,
    outputDirectory: string,
    publicDirectory: string,
}

export const processImage = async (props: Props) => {
    const [loaded] = await Promise.all([
        loadImage(props),
        clearDirectory(props.outputDirectory),
    ]);
    const {imagePool} = loaded;
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
    await imagePool.close();
    return result;
};

const clearDirectory = async (directoryPath: string) => {
    await rmrf(directoryPath);
    await fs.promises.mkdir(directoryPath, {recursive: true});
};

const loadImage = async (
    {absolutePath, rootDirectory}: {
        absolutePath: string,
        rootDirectory: string,
    },
) => {
    // eslint-disable-next-line import/dynamic-import-chunkname
    const {ImagePool, encoders} = await import('@squoosh/lib');
    const imagePool = new ImagePool(os.cpus().length);
    const sourceBuffer = await fs.promises.readFile(absolutePath);
    const image = imagePool.ingestImage(sourceBuffer);
    const {bitmap} = await image.decoded;
    const source: ImageData = {
        path: ['', ...path.relative(rootDirectory, absolutePath).split(path.sep)].join('/'),
        hash: getHash(sourceBuffer).toString('base64url'),
        width: bitmap.width,
        height: bitmap.height,
        size: sourceBuffer.byteLength,
    };
    const encodeOptions: SquooshEncodeOptions = {
        webp: {...encoders.webp.defaultEncoderOptions},
        avif: {...encoders.avif.defaultEncoderOptions},
    };
    switch (path.extname(absolutePath)) {
    case '.png':
        encodeOptions.oxipng = {...encoders.oxipng.defaultEncoderOptions};
        break;
    default:
        encodeOptions.mozjpeg = {...encoders.mozjpeg.defaultEncoderOptions};
    }
    return {source, sourceBuffer, image, imagePool, encodeOptions};
};
