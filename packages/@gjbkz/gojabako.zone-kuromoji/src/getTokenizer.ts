import * as path from 'path';
import type {IpadicFeatures, Tokenizer} from 'kuromoji';
import kuromoji from 'kuromoji';

export const getTokenizer = async (rootDirectory: string) => {
    const dicPath = path.join(rootDirectory, 'node_modules', 'kuromoji', 'dict');
    return await new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
        // eslint-disable-next-line import/no-named-as-default-member
        kuromoji.builder({dicPath}).build((error: unknown, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
};
