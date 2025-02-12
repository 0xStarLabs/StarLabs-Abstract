import { load } from "js-yaml";
import { promises as fs } from "fs";
import { resolve } from "path";
import { Mutex } from "async-mutex";

interface Settings {
    threads: number;
    account_range: [number, number];
    attempts: number;
    tasks_attempts: number;
    pause_between_attempts: [number, number];
    random_pause_between_accounts: [number, number];
    random_pause_between_actions: [number, number];
    random_pause_between_swaps: [number, number];
    pause_after_bridge: [number, number];
    pause_after_withdrawal: [number, number];
    show_browser_window: boolean;
}

interface RPCs {
    arbitrum_rpc: string[];
    abstract_rpc: string[];
}

interface Bridge {
    eth_to_bridge: [number, number];
}

interface Withdraw {
    withdraw_enabled: boolean;
    cex: "okx" | "bitget";
    api_key: string;
    secret_key: string;
    password: string;
    amount: [number, number];
    network: "Arbitrum";
}

interface Abs {
    minimal_usd_balance: number;
    balance_percent_to_swap: [number, number];
    number_of_swaps: [number, number];
    number_of_votes: [number, number];
    tasks: string[];
}

export interface Config {
    settings: Settings;
    rpcs: RPCs;
    bridge: Bridge;
    withdraw: Withdraw;
    abs: Abs;
    mutex?: Mutex;
}

/**
 * Reads and parses the config.yaml file
 * @returns Parsed configuration object
 * @throws Error if config file is invalid or cannot be read
 */
export async function readConfig(): Promise<Config> {
    try {
        const configPath = resolve("data/config.yaml");
        const fileContent = await fs.readFile(configPath, "utf-8");
        const config = load(fileContent) as Config;

        // Validate config here if needed
        validateConfig(config);

        return config;
    } catch (error) {
        throw new Error(`Failed to read config: ${error}`);
    }
}

/**
 * Validates the configuration object
 * @param config - Configuration object to validate
 * @throws Error if configuration is invalid
 */
function validateConfig(config: Config): void {
    // Validate settings
    if (!config.settings) throw new Error("Missing settings in config");
    if (!config.settings.threads)
        throw new Error("Missing threads field in config");
    if (!config.settings.attempts)
        throw new Error("Missing attempts in settings");
    if (!Array.isArray(config.settings.pause_between_attempts))
        throw new Error("Invalid pause_between_attempts format");

    // Validate RPCs
    if (!config.rpcs) throw new Error("Missing RPCs in config");
    if (!Array.isArray(config.rpcs.arbitrum_rpc))
        throw new Error("Invalid arbitrum_rpc format");
    if (!Array.isArray(config.rpcs.abstract_rpc))
        throw new Error("Invalid abstract_rpc format");

    // Validate bridge settings
    if (!config.bridge) throw new Error("Missing bridge settings");
    if (!Array.isArray(config.bridge.eth_to_bridge))
        throw new Error("Invalid eth_to_bridge format");

    // Validate withdraw settings
    if (!config.withdraw) throw new Error("Missing withdraw settings");
    if (!["okx", "bitget"].includes(config.withdraw.cex))
        throw new Error("Invalid CEX specified");
    if (config.withdraw.network !== "Arbitrum")
        throw new Error("Invalid network specified");
    if (!Array.isArray(config.withdraw.amount))
        throw new Error("Invalid withdraw amount format");

    // Validate abs settings
    if (!config.abs) throw new Error("Missing abs settings");
    if (typeof config.abs.minimal_usd_balance !== "number")
        throw new Error("Invalid minimal_usd_balance format");
    if (!Array.isArray(config.abs.balance_percent_to_swap))
        throw new Error("Invalid balance_percent_to_swap format");
    if (!Array.isArray(config.abs.number_of_swaps))
        throw new Error("Invalid number_of_swaps format");
}
