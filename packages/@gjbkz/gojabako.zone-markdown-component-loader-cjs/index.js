/* eslint-disable */
module.exports = async function markdownComponentLoader(source) {
    const {default: loadMarkdownPage} = await import('@gjbkz/gojabako.zone-markdown-component-loader');
    const code = await loadMarkdownPage.call(this, source);
    // console.info(code);
    return code;
};
