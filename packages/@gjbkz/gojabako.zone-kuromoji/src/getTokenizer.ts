import * as path from 'path';
import type {IpadicFeatures, Tokenizer} from 'kuromoji';
import {builder} from 'kuromoji';

export const getTokenizer = async (rootDirectory: string) => {
    const dicPath = path.join(rootDirectory, 'node_modules', 'kuromoji', 'dict');
    return await new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
        builder({dicPath}).build((error: unknown, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
};
