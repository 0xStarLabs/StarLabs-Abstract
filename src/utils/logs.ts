import { promises as fs } from "fs";
import { join, dirname } from "path";
import { Mutex } from "async-mutex";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export interface ProgressData {
    EvmPrivateKey: string;
    PrivyPrivateKey: string;
    EvmAddress: string;
    PrivyAddress: string;
    Points: number;
    AbsUsdBalance: string;
    BadgesClaimed: number;
    IsTwitterConnected: boolean;
    IsDiscordConnected: boolean;
}

/**
 * Log successful operations to separate files in data/success_data directory.
 * Uses mutex to prevent race conditions.
 *
 * @param lock - Mutex for thread-safe file operations
 * @param privateKey - The private key to log
 * @param proxy - The proxy to log
 * @param twitterToken - The Twitter token to log
 */
export async function reportSuccess(
    lock: Mutex,
    privateKey: string,
    proxy: string,
    twitterToken: string
): Promise<void> {
    const baseDir = "data/success_data";

    await lock.acquire();
    try {
        // Ensure directory exists
        await fs.mkdir(baseDir, { recursive: true });

        // Define files and their corresponding data
        const filesData: Record<string, string> = {
            "private_keys.txt": privateKey,
            "proxies.txt": proxy,
            "twitter_tokens.txt": twitterToken,
        };

        // Write each type of data to its respective file
        await Promise.all(
            Object.entries(filesData).map(async ([filename, data]) => {
                if (data) {
                    // Only write if data is not empty
                    const filepath = join(baseDir, filename);
                    await fs.appendFile(filepath, `${data}\n`, "utf-8");
                }
            })
        );
    } finally {
        lock.release();
    }
}

/**
 * Log failed operations to separate files in data/error_data directory.
 * Uses mutex to prevent race conditions.
 *
 * @param lock - Mutex for thread-safe file operations
 * @param privateKey - The private key to log
 * @param proxy - The proxy to log
 * @param twitterToken - The Twitter token to log
 */
export async function reportError(
    lock: Mutex,
    privateKey: string,
    proxy: string,
    twitterToken: string
): Promise<void> {
    const baseDir = "data/error_data";

    await lock.acquire();
    try {
        // Ensure directory exists
        await fs.mkdir(baseDir, { recursive: true });

        // Define files and their corresponding data
        const filesData: Record<string, string> = {
            "private_keys.txt": privateKey,
            "proxies.txt": proxy,
            "twitter_tokens.txt": twitterToken,
        };

        // Write each type of data to its respective file
        await Promise.all(
            Object.entries(filesData).map(async ([filename, data]) => {
                if (data) {
                    // Only write if data is not empty
                    const filepath = join(baseDir, filename);
                    await fs.appendFile(filepath, `${data}\n`, "utf-8");
                }
            })
        );
    } finally {
        lock.release();
    }
}

/**
 * Save progress data to an Excel file
 * @param lock - Mutex for thread-safe file operations
 * @param data - Progress data to save
 */
export async function saveProgress(
    lock: Mutex,
    data: ProgressData
): Promise<void> {
    await lock.acquire();
    try {
        const baseDir = "data";
        const filepath = join(baseDir, "progress.xlsx");

        // Check if file exists
        let workbook: XLSX.WorkBook;
        let worksheet: XLSX.WorkSheet;

        try {
            const fileExists = await fs
                .access(filepath)
                .then(() => true)
                .catch(() => false);

            if (fileExists) {
                // Read existing file
                const fileBuffer = await fs.readFile(filepath);
                workbook = XLSX.read(fileBuffer);
                worksheet = workbook.Sheets[workbook.SheetNames[0]];
            } else {
                // Create new workbook with headers
                workbook = XLSX.utils.book_new();
                worksheet = XLSX.utils.json_to_sheet([]);
                XLSX.utils.book_append_sheet(workbook, worksheet, "Progress");

                // Add headers
                XLSX.utils.sheet_add_aoa(
                    worksheet,
                    [
                        [
                            "EvmPrivateKey",
                            "PrivyPrivateKey",
                            "EvmAddress",
                            "PrivyAddress",
                            "Points",
                            "AbsUsdBalance",
                            "BadgesClaimed",
                            "IsTwitterConnected",
                            "IsDiscordConnected",
                        ],
                    ],
                    { origin: "A1" }
                );
            }

            // Get next empty row
            const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
            const nextRow = range.e.r + 1; // +1 because range is 0-based

            // Add new row
            const rowData = [
                data.EvmPrivateKey,
                data.PrivyPrivateKey,
                data.EvmAddress,
                data.PrivyAddress,
                data.Points,
                data.AbsUsdBalance                ,
                data.BadgesClaimed,
                data.IsTwitterConnected,
                data.IsDiscordConnected,
            ];

            XLSX.utils.sheet_add_aoa(worksheet, [rowData], {
                origin: `A${nextRow + 1}`,
            });

            // Save workbook
            const buffer = XLSX.write(workbook, {
                type: "buffer",
                bookType: "xlsx",
            });
            await fs.writeFile(filepath, buffer);
        } catch (error) {
            throw new Error(`Failed to save progress: ${error}`);
        }
    } finally {
        lock.release();
    }
}
