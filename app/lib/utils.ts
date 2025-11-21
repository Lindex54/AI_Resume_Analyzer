/**
 * Formats a file size in bytes to a human-readable string (KB, MB, GB>
 * @param bytes - The size in bytes
 * @returns A formatted string with the appropriate unit
 */

export function formatSize(bytes: number) : string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes:string[] = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    // Determine the appropriate unit by calculating the log
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // Format with 2 decimal places and round
    return parseFloat( (bytes/Math.pow(k, i)).toFixed(2)+ ' ' + sizes[i]).toFixed(2);
}
