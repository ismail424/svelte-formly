/**
 * Convert byts to diffirents sizes types.
 * @param {number} bytes
 */
export function bytesToSize(bytes: any) {
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	if (bytes === 0) return 'n/a';
	const bytes_flor = Math.floor(Math.log(bytes) / Math.log(1024));
	const i = parseInt(bytes_flor.toString(), 10);
	if (i === 0) return `${bytes} ${sizes[i]})`;
	return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
}

/**
 * Get extension file.
 * @param {file} file.
 */
export function getFileExtension(file: File) {
    // Check if file exists and has a name property
    if (!file || !file.name) {
        return '';
    }
    
    const filenameParts = file.name.split('.');
    
    // If there's only one part (no dots) or empty filename, return empty string
    if (filenameParts.length <= 1) {
        return '';
    }
    
    return filenameParts[filenameParts.length - 1].toLowerCase();
}

/**
 * Validate by types.
 * @param {file} file .file object.
 * @param {array} allowedFileTypes list allowed types file.
 */
export function extensions(file: File, allowedFileTypes: string[]) {
	if (!allowedFileTypes.includes(getFileExtension(file))) {
		return false;
	}
	return true;
}

/**
 * Validate by size.
 * @param {file} file .file object.
 * @param {number} maxFileSize max size file.
 */
export function maxSize(file: File, maxFileSize: any) {
	const maxSize = parseFloat(maxFileSize) * 1024 * 1024;

	if (file.size > maxSize) {
		return false;
	}
	return true;
}
