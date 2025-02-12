import { promises as fs } from "fs";
import { resolve } from "path";
import colors from "colors";

/**
 * Reads a text file line by line asynchronously and returns an array of stripped lines
 * @param fileName - Name of the file (for logging)
 * @param filePath - Path to the file to read
 * @returns Promise resolving to array of stripped lines from the file
 */
export async function readTxtFile(
    fileName: string,
    filePath: string
): Promise<string[]> {
    try {
        const absolutePath = resolve(filePath);
        const fileContent = await fs.readFile(absolutePath, "utf-8");
        const items = fileContent
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        console.log(
            colors.cyan("[SUCCESS] ") +
                `Successfully loaded ${items.length} ${fileName}.`
        );

        return items;
    } catch (error) {
        console.error(
            colors.red("[ERROR] ") +
                `Failed to read ${fileName} from ${filePath}: ${error}`
        );
        return [];
    }
}
