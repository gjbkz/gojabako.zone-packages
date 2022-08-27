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
    dependencies: isString.dictionary,
    devDependencies: isString.dictionary,
    workspaces: isString.array,
});
const rootPackageJson = ensure(
    JSON.parse(await fs.readFile(rootPackageJsonPath, 'utf8')),
    isRootPackageJson,
);

const dependencyEdges = new Set<string>();
const packages = await fs.readdir(namespaceDirectory);
for await (const name of packages) {
    console.info(name);
    const packageJsonPath = new URL(`${name}/package.json`, namespaceDirectory);
    const currentPackageJson = ensure(
        JSON.parse(await fs.readFile(packageJsonPath, 'utf8')),
        isObject,
    );
    const packageJson: Record<string, unknown> = {};
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
    packageJson.type = 'module';
    packageJsonMap.delete('type');
    packageJson.main = 'esm/index.mjs';
    packageJsonMap.delete('main');
    packageJson.files = ['esm'];
    packageJsonMap.delete('files');
    for (const [key, value] of packageJsonMap) {
        packageJson[key] = value;
    }
    const {dependencies} = packageJson;
    const references: Array<{path: string}> = [];
    // const paths: Record<string, Array<string>> = {};
    if (isString.dictionary(dependencies)) {
        for (const dependency of Object.keys(dependencies)) {
            if (dependency.startsWith(rootPackageJson.name)) {
                dependencies[dependency] = rootPackageJson.version;
                const prefixLength = namespace.length + 1;
                const dependencyName = dependency.slice(prefixLength);
                dependencyEdges.add(`${name}→${dependencyName}`);
                references.push({path: `../${dependencyName}`});
                // paths[`${namespace}/${name}`] = [`../../${dependencyName}`];
            }
        }
    }
    const tsconfigPath = new URL(`${name}/tsconfig.json`, namespaceDirectory);
    const tsconfig: Record<string, unknown> = {
        extends: '../../../tsconfig.json',
        compilerOptions: {
            composite: true,
            outDir: './esm',
            rootDir: './src',
            // paths,
        },
        include: ['./src/**/*.ts'],
        exclude: ['./src/**/*.test.ts'],
        references,
    };
    await Promise.all([
        fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 4)),
        fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 4)),
    ]);
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
