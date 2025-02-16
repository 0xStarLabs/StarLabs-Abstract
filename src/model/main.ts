import { ethers } from "ethers";
import { Client } from "../utils/client.js";
import { Config } from "../utils/config.js";
import logger from "../utils/logger.js";
import { AbstractAccount } from "./abstract/account.js";
import { getRandomRpc } from "../utils/random.js";

export class Abstract {
    private wallet: ethers.Wallet;
    public address: string;
    private client: Client | null = null;
    private provider: ethers.JsonRpcProvider;

    constructor(
        private accountIndex: number,
        private proxy: string,
        private privateKey: string,
        private privyPrivateKey: string,
        private twitterToken: string,
        private discordToken: string,
        private config: Config
    ) {
        this.wallet = new ethers.Wallet(privateKey);
        this.address = this.wallet.address;
        this.provider = new ethers.JsonRpcProvider(
            getRandomRpc(config.rpcs.arbitrum_rpc)
        );
    }

    async initialize(): Promise<boolean> {
        try {
            this.client = new Client(this.proxy);
            await this.client.init();

            return true;
        } catch (error) {
            logger.error(
                `${this.address} | Error initializing client: ${error}`
            );
            return false;
        }
    }

    async cleanup(): Promise<void> {
        if (this.client) {
            this.client = null;
        }
    }

    async abs(): Promise<boolean> {
        try {
            if (!this.client) {
                throw new Error("Client not initialized");
            }

            const absClient = new AbstractAccount(
                this.accountIndex,
                this.proxy,
                this.privateKey,
                this.privyPrivateKey,
                this.twitterToken,
                this.discordToken,
                this.config,
                this.client
            );

            let ok = await absClient.login();
            if (!ok) {
                return false;
            }

            if (this.config.abs.tasks.includes("connect_socials")) {
                await absClient.connectSocials();
            }
            if (this.config.abs.tasks.includes("swaps")) {
                await absClient.swaps();
            }

            // if (this.config.abs.tasks.includes("myriad")) {
            //     await absClient.myriad();
            // }

            if (this.config.abs.tasks.includes("votes")) {
                await absClient.votes();
            }
            if (this.config.abs.tasks.includes("badges")) {
                await absClient.badges();
            }
            if (this.config.abs.tasks.includes("collect_all_to_eth")) {
                await absClient.collectAllToEth();
            }

            if (this.config.abs.tasks.includes("logs")) {
                await absClient.collectAllData();
            }
            return true;
        } catch (error) {
            logger.error(`${this.address} | Error in abs execution: ${error}`);
            return false;
        } finally {
            await this.cleanup();
        }
    }
}
