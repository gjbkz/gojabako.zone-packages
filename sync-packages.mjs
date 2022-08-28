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
const namespace = '@gjbkz';
const namespaceDirectory = new URL(`packages/${namespace}/`, rootDirectory);
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
    dependencies: isString.dictionary.optional,
    devDependencies: isString.dictionary.optional,
    workspaces: isString.array,
});
const rootPackageJson = ensure(
    JSON.parse(await fs.readFile(rootPackageJsonPath, 'utf8')),
    isRootPackageJson,
);

/** @type {Set<string>} */
const dependencyEdges = new Set();
const packages = await fs.readdir(namespaceDirectory);
for await (const name of packages) {
    console.info(name);
    const packageJsonPath = new URL(`${name}/package.json`, namespaceDirectory);
    const currentPackageJson = ensure(
        JSON.parse(await fs.readFile(packageJsonPath, 'utf8')),
        isObject,
    );
    const packageJson = {};
    const packageJsonMap = new Map(Object.entries(currentPackageJson));
    packageJson.name = `${namespace}/${name}`;
    packageJsonMap.delete('name');
    packageJson.version = rootPackageJson.version;
    packageJsonMap.delete('version');
    packageJson.publishConfig = {access: 'public'};
    packageJsonMap.delete('publishConfig');
    packageJson.license = rootPackageJson.license;
    packageJsonMap.delete('license');
    packageJson.author = rootPackageJson.author;
    packageJsonMap.delete('author');
    packageJson.homepage = `${rootPackageJson.homepage}/tree/main/packages/${name}`;
    packageJsonMap.delete('homepage');
    packageJson.repository = rootPackageJson.repository;
    packageJsonMap.delete('repository');
    packageJson.type = packageJsonMap.get('type') || 'module';
    packageJsonMap.delete('type');
    packageJson.main = packageJsonMap.get('main') || 'esm/index.mjs';
    packageJsonMap.delete('main');
    packageJson.files = packageJsonMap.get('files') || ['esm'];
    packageJsonMap.delete('files');
    for (const [key, value] of packageJsonMap) {
        packageJson[key] = value;
    }
    const {dependencies} = packageJson;
    /** @type {Array<{path: string}>} */
    const references = [];
    /** @type {Record<string, Array<string>>} */
    const paths = {};
    if (isString.dictionary(dependencies)) {
        for (const dependency of Object.keys(dependencies)) {
            if (dependency.startsWith(rootPackageJson.name)) {
                dependencies[dependency] = rootPackageJson.version;
                const prefixLength = namespace.length + 1;
                const dependencyName = dependency.slice(prefixLength);
                dependencyEdges.add(`${name}→${dependencyName}`);
                references.push({path: `../${dependencyName}`});
                paths[`${namespace}/${name}`] = [`../../${dependencyName}/src`];
            }
        }
    }
    const tsconfigPath = new URL(`${name}/tsconfig.json`, namespaceDirectory);
    if (await fs.stat(tsconfigPath).catch(() => null) !== null) {
        const currentTsconfig = ensure(
            JSON.parse(await fs.readFile(tsconfigPath, 'utf8')),
            {compilerOptions: isObject},
        );
        const tsconfig = {
            extends: '../../../tsconfig.json',
            compilerOptions: {
                composite: true,
                outDir: './esm',
                rootDir: './src',
                ...currentTsconfig.compilerOptions,
                paths: undefined,
                // paths,
            },
            include: ['./src/**/*.ts'],
            exclude: ['./src/**/*.test.ts'],
            references,
        };
        await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 4));
    }
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 4));
}
packages.sort((a, b) => {
    if (dependencyEdges.has(`${a}→${b}`)) {
        return 1;
    }
    if (dependencyEdges.has(`${b}→${a}`)) {
        return -1;
    }
    return 0;
});
rootPackageJson.workspaces = packages.map((name) => `packages/${namespace}/${name}`);
await fs.writeFile(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 4));
