export const getImageContentType = (filePath: string): string => {
    switch (filePath.slice(filePath.lastIndexOf('.'))) {
    case '.webp':
        return 'image/webp';
    case '.avif':
        return 'image/avif';
    case '.jpg':
    case '.jpeg':
        return 'image/jpeg';
    case '.png':
        return 'image/png';
    case '.svg':
        return 'image/svg+xml';
    default:
        throw new Error(`UnsupportedExtension: ${filePath}`);
    }
};
