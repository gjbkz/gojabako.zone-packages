import type {GuardedType} from '@nlib/typing';
import {createTypeChecker, isNonNegativeSafeInteger} from '@nlib/typing';
import {isImageData} from './isImageData';

export const isEncodeResult = createTypeChecker('EncodeResult', {
    version: isNonNegativeSafeInteger,
    source: isImageData,
    results: isImageData.array,
});

export type EncodeResult = GuardedType<typeof isEncodeResult>;
