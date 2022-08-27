import {lowlight} from 'lowlight';
import {serializeLowlightToJsx} from './serializeLowlightToJsx';

export const serializeCodeToJsx = function* (
    language: string | null | undefined,
    source: string,
) {
    if (language) {
        yield* serializeLowlightToJsx(lowlight.highlight(language, source));
    } else {
        yield* serializeLowlightToJsx(lowlight.highlightAuto(source));
    }
};
