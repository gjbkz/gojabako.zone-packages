import fs from 'fs/promises';

const rootDirectory = new URL('.', import.meta.url);
const namespace = '@gjbkz';
const namespaceDirectory = new URL(`packages/${namespace}/`, rootDirectory);
/** @param {URL} fileUrl */
const deleteFile = async (fileUrl) => {
    const stat = await fs.stat(fileUrl).catch(() => null);
    if (stat) {
        if (stat.isDirectory()) {
            for (const name of await fs.readdir(fileUrl)) {
                await deleteFile(new URL(name, fileUrl));
            }
        } else {
            await fs.unlink(fileUrl).catch(() => null);
        }
    }
};

for (const name of await fs.readdir(namespaceDirectory)) {
    const directory = new URL(`${name}/`, namespaceDirectory);
    await deleteFile(new URL('tsconfig.tsbuildinfo', directory));
    await deleteFile(new URL('esm', directory));
}
