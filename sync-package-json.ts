import console from 'console';
import fs from 'fs/promises';
import {
    createTypeChecker,
    definition,
    ensure,
    isEmailAddress,
    isHttpsUrlString,
    isObject,
    isString,
} from '@nlib/typing';

const rootDirectory = new URL('.', import.meta.url);
const packagesDirectory = new URL('packages/', rootDirectory);
const rootPackageJsonPath = new URL('package.json', rootDirectory);
const isRootPackageJson = createTypeChecker('RootPackageJson', {
    name: isString,
    private: definition.enum(true),
    version: isString,
    license: isString,
    author: {
        name: isString,
        email: isEmailAddress,
        url: isHttpsUrlString,
    },
    homepage: isHttpsUrlString,
    repository: isHttpsUrlString,
    type: isString,
    scripts: isString.dictionary,
    dependencies: isString.dictionary,
    devDependencies: isString.dictionary,
});
const rootPackageJson = ensure(
    JSON.parse(await fs.readFile(rootPackageJsonPath, 'utf8')),
    isRootPackageJson,
);

for await (const name of await fs.readdir(packagesDirectory)) {
    console.info(name);
    const packageJsonPath = new URL(`${name}/package.json`, packagesDirectory);
    const packageJson = ensure(
        JSON.parse(await fs.readFile(packageJsonPath, 'utf8')),
        isObject,
    );
    const patched: Record<string, unknown> = {};
    const map = new Map(Object.entries(packageJson));
    patched.name = `${rootPackageJson.name}-${name}`;
    map.delete('name');
    patched.version = rootPackageJson.version;
    map.delete('version');
    patched.publishConfig = {access: 'public'};
    map.delete('publishConfig');
    patched.license = rootPackageJson.license;
    map.delete('license');
    patched.author = rootPackageJson.author;
    map.delete('author');
    patched.homepage = `${rootPackageJson.homepage}/tree/main/packages/${name}`;
    map.delete('homepage');
    patched.repository = rootPackageJson.repository;
    map.delete('repository');
    patched.type = 'module';
    map.delete('type');
    patched.main = 'esm/index.mjs';
    map.delete('main');
    patched.files = ['esm'];
    map.delete('files');
    for (const [key, value] of map) {
        patched[key] = value;
    }
    await fs.writeFile(packageJsonPath, JSON.stringify(patched, null, 4));
}
