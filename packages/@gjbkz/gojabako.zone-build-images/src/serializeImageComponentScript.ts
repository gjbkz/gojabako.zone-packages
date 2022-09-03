import {getImageContentType} from './getImageContentType';
import type {EncodeResult} from './isEncodeResult';
import type {ImageData} from './isImageData';

export const serializeImageComponentScript = function* (encodeResult: EncodeResult) {
    const resultMap = new Map<string, Array<ImageData>>();
    const getList = (filePath: string) => {
        const type = getImageContentType(filePath);
        const list = resultMap.get(type) || [];
        resultMap.set(type, list);
        return list;
    };
    for (const result of encodeResult.results) {
        getList(result.path).push(result);
    }
    yield '/* eslint-disable @next/next/no-img-element */';
    yield 'import type {DetailedHTMLProps, ImgHTMLAttributes} from \'react\';';
    yield '';
    yield 'const Image = (';
    yield '    props: Omit<DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>, \'height\' | \'src\' | \'srcset\' | \'width\'>,';
    const {source} = encodeResult;
    const aspectRatioStyle = `style={{aspectRatio: '${source.width}/${source.height}'}}`;
    yield `) => <picture ${aspectRatioStyle}>`;
    for (const [type, results] of resultMap) {
        const srcset = results.map((result) => `${result.path} ${result.width}w`).join(', ');
        if (getImageContentType(source.path) === type) {
            yield `    <img alt="" {...props} srcSet="${srcset}" ${aspectRatioStyle} />`;
        } else {
            yield `    <source srcSet="${srcset}" type="${type}" />`;
        }
    }
    yield '</picture>;';
    yield '// eslint-disable-next-line import/no-default-export';
    yield 'export default Image;';
    yield '';
};
