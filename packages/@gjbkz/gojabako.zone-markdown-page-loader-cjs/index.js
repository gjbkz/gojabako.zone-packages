/* eslint-disable */
module.exports = async function markdownPageLoader(source) {
    const {loadMarkdownPage} = await import('@gjbkz/gojabako.zone-markdown-page-loader');
    const code = await loadMarkdownPage.call(this, source);
    // console.info(code);
    return code;
};
