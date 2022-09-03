const defaultWidthList = [600, 800, 1000, 1200, 1500, 1800];

export const listImageWidthPatterns = function* (
    originalWidth: number,
    widthList = defaultWidthList,
) {
    let widthPatternCount = 0;
    for (const width of widthList) {
        if (width <= originalWidth) {
            widthPatternCount++;
            yield width;
        }
    }
    if (widthPatternCount === 0) {
        yield originalWidth;
    }
};
