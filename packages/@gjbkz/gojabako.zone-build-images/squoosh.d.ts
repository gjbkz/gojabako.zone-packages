export interface ResizeOptions {
    width: number,
    height: number,
    method: 'catrom' | 'lanczos3' | 'mitchell' | 'triangle',
    premultiply: boolean,
    linearRGB: boolean,
}
export interface QuantOptions {
    numColors: number,
    dither: number,
}
export interface RotateOptions {
    numRotations: number,
}
export interface PreprocessOptions {
    resize?: Partial<Omit<ResizeOptions, 'height' | 'width'>> & (Pick<ResizeOptions, 'height'> | Pick<ResizeOptions, 'width'>),
    quant?: Partial<QuantOptions>,
    rotate?: Partial<RotateOptions>,
}
type EncodeOptions = Record<string, unknown>;
export interface EncoderOptions {
    mozjpeg?: Partial<EncodeOptions>,
    webp?: Partial<EncodeOptions>,
    avif?: Partial<EncodeOptions>,
    jxl?: Partial<EncodeOptions>,
    wp2?: Partial<EncodeOptions>,
    oxipng?: Partial<EncodeOptions>,
}
export type EncoderKey = keyof EncoderOptions;
export interface EncodeResult {
    optionsUsed: Record<string, unknown>,
    binary: Uint8Array,
    extension: string,
    size: number,
}
interface ImageDataClass {
    readonly data: Uint8ClampedArray,
    readonly width: number,
    readonly height: number,
}
interface SquooshImage {
    file: ArrayBuffer | ArrayLike<number>,
    decoded: Promise<{bitmap: ImageDataClass}>,
    encodedWith: {
        [key in EncoderKey]?: EncodeResult;
    },
    preprocess: (preprocessOptions?: PreprocessOptions) => Promise<void>,
    /**
     * Define one or several encoders to use on the image.
     * @param {object} encodeOptions - An object with encoders to use, and their settings.
     * @returns {Promise<{ [key in keyof T]: EncodeResult }>} - A promise that resolves when the image has been encoded with all the specified encoders.
     */
    encode: <T extends EncoderOptions>(encodeOptions: T & {
        optimizerButteraugliTarget?: number,
        maxOptimizerRounds?: number,
    }) => Promise<{
        [key in keyof T]: EncodeResult;
    }>,
}
export class ImagePool {
    public constructor(threads: number);
    public ingestImage(file: ArrayBuffer | ArrayLike<number>): SquooshImage;
    public close(): Promise<void>;
}
export const encoders: {
    [K in EncoderKey]: {
        defaultEncoderOptions: EncodeOptions,
    };
};

// I don't know why, but I need this to avoid type errors from @types/katex.
declare global {
    interface HTMLElement {}
}
