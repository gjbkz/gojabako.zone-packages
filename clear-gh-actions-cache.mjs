import {createTypeChecker, ensure, isNonNegativeSafeInteger, isSafeInteger, isString} from '@nlib/typing';

/* eslint-disable no-undef, import/unambiguous */
export {};
const owner = 'gjbkz';
const repo = 'gojabako.zone-markdown';
const baseUrl = new URL(`https://api.github.com/repos/${owner}/${repo}/`);
const headers = {
    accept: 'application/vnd.github.v3+json',
    authorization: `token ${process.env.GITHUB_PAT}`,
};
const listRes = await fetch(new URL('actions/caches', baseUrl), {headers});
const isActionCache = createTypeChecker('ActionCache', {
    id: isSafeInteger,
    ref: isString,
    key: isString,
    version: isString,
    last_accessed_at: isString,
    created_at: isString,
    size_in_bytes: isNonNegativeSafeInteger,
});
const result = ensure(await listRes.json(), {
    total_count: isNonNegativeSafeInteger,
    actions_caches: isActionCache.array,
});
for (const cache of result.actions_caches) {
    console.info(cache);
    const res = await fetch(new URL(`actions/caches/${cache.id}`, baseUrl), {
        method: 'DELETE',
        headers,
    });
    console.info(`${res.status} ${res.statusText}`);
    console.info(await res.text());
}
