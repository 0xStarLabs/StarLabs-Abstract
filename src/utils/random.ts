import { Config } from "./config.js";
import logger from "./logger.js";

export function getRandomRpc(rpcs: string[]): string {
    return rpcs[Math.floor(Math.random() * rpcs.length)];
}

// Utility functions
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function randomItemFromArray<T>(array: T[]): Promise<T> {
    return array[Math.floor(Math.random() * array.length)];
}


export async function randomSleep(
    config: Config,
    task: string,
    address: string
): Promise<void> {
    const pause = randomInt(
        config.settings.random_pause_between_actions[0],
        config.settings.random_pause_between_actions[1]
    );
    logger.info(`${address} | Sleeping for ${pause} seconds after ${task}...`);
    await sleep(pause * 1000);
}

/**
 * Generates a random hex string of specified length
 */
export function generateCsrfToken(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    const token = Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');

    return token;

}

/**
 * Get a random float between min and max (inclusive)
 * @param min Minimum value
 * @param max Maximum value
 * @returns Random float between min and max
 */
export function getRandomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}