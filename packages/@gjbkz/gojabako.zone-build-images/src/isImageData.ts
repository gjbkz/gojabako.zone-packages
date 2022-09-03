import type {GuardedType} from '@nlib/typing';
import {createTypeChecker, isPositiveSafeInteger, isString} from '@nlib/typing';

export const isImageData = createTypeChecker('ImageData', {
    path: isString,
    hash: isString,
    width: isPositiveSafeInteger,
    height: isPositiveSafeInteger,
    size: isPositiveSafeInteger,
});

export type ImageData = GuardedType<typeof isImageData>;
