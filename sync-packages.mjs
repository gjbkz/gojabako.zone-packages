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
    dependencies: isString.dictionary.optional,
    devDependencies: isString.dictionary.optional,
    workspaces: isString.array,
});
const rootPackageJson = ensure(
    JSON.parse(await fs.readFile(rootPackageJsonPath, 'utf8')),
    isRootPackageJson,
);

/** @type {Map<string, Set<string>>} */
const dependencyMap = new Map();
const packages = (await fs.readdir(new URL(`${namespace}/`, packagesDirectory))).map((name) => `${namespace}/${name}`);
for await (const packageName of packages) {
    const packageJsonPath = new URL(`${packageName}/package.json`, packagesDirectory);
    const currentPackageJson = ensure(
        JSON.parse(await fs.readFile(packageJsonPath, 'utf8')),
        isObject,
    );
    const packageJson = {};
    const packageJsonMap = new Map(Object.entries(currentPackageJson));
    packageJson.name = packageName;
    packageJsonMap.delete('name');
    packageJson.version = rootPackageJson.version;
    packageJsonMap.delete('version');
    packageJson.publishConfig = {access: 'public'};
    packageJsonMap.delete('publishConfig');
    packageJson.license = rootPackageJson.license;
    packageJsonMap.delete('license');
    packageJson.author = rootPackageJson.author;
    packageJsonMap.delete('author');
    packageJson.homepage = `${rootPackageJson.homepage}/tree/main/packages/${packageName}`;
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
        const keys = Object.keys(dependencies).filter((name) => name.startsWith(namespace));
        dependencyMap.set(packageName, new Set(keys));
        for (const dependency of keys) {
            dependencies[dependency] = rootPackageJson.version;
            const prefixLength = namespace.length + 1;
            const dependencyName = dependency.slice(prefixLength);
            references.push({path: `../${dependencyName}`});
            paths[packageName] = [`../${dependencyName}/src`];
        }
    }
    const tsconfigPath = new URL(`${packageName}/tsconfig.json`, packagesDirectory);
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
                baseUrl: '.',
                paths: {
                    // ...paths,
                    ...currentTsconfig.compilerOptions.paths,
                },
            },
            include: ['./src/**/*.ts'],
            exclude: ['./src/**/*.test.ts'],
            references,
        };
        await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 4));
    }
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 4));
}
/**
 * @param {string} name
 * @param {Set<string>} history
 */
const listDependencies = function* (name, history = new Set()) {
    const set = dependencyMap.get(name);
    if (set) {
        for (const dependency of set) {
            if (!history.has(dependency)) {
                yield dependency;
                history.add(dependency);
                yield* listDependencies(dependency, history);
            }
        }
    }
};
packages.sort((a, b) => {
    for (const dependency of listDependencies(a)) {
        if (dependency === b) {
            return 1;
        }
    }
    for (const dependency of listDependencies(b)) {
        if (dependency === a) {
            return -1;
        }
    }
    return 0;
});
console.info(packages);
rootPackageJson.workspaces = packages.map((name) => `packages/${name}`);
await fs.writeFile(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 4));
