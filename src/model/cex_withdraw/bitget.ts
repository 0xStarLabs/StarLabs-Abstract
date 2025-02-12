import ccxt, { Exchange } from "ccxt";
import colors from "colors";
import { Config } from "../../utils/config.js";
import logger from "../../utils/logger.js";
import { ethers } from "ethers";

const NETWORK_MAPPING: { [key: string]: string } = {
    Arbitrum: "Arbitrum One",
};

// Define our own withdrawal response type
interface WithdrawalResult {
    id: string;
    txid?: string;
    info: any;
    timestamp: number;
    datetime: string;
    network: string;
    address: string;
    tag?: string;
    amount: number;
    currency: string;
    status: string;
    fee?: {
        currency: string;
        cost: number;
    };
}

export class BitgetWithdraw {
    private exchange: Exchange;
    private wallet: ethers.Wallet;
    public address: string;

    constructor(
        private accountIndex: number,
        private privateKey: string,
        private config: Config
    ) {
        // Initialize Bitget exchange
        this.exchange = new ccxt.bitget({
            apiKey: this.config.withdraw.api_key,
            secret: this.config.withdraw.secret_key,
            password: this.config.withdraw.password,
            enableRateLimit: true,
        });

        this.wallet = new ethers.Wallet(privateKey);
        this.address = this.wallet.address;
    }

    /**
     * Withdraw ETH from Bitget using config settings
     * @returns Withdrawal transaction details
     */
    async withdraw(): Promise<boolean> {
        try {
            logger.info(
                `${this.accountIndex} | ${this.address} | Starting Bitget withdrawal`
            );

            // Get initial balance
            const provider = new ethers.JsonRpcProvider(
                this.config.rpcs.arbitrum_rpc[0]
            );
            const initialBalance = await provider.getBalance(this.address);
            logger.info(
                `${this.accountIndex} | ${
                    this.address
                } | Initial balance: ${ethers.formatEther(initialBalance)} ETH`
            );

            // Get random amount from config range
            const amount = this.getRandomAmount();

            // Execute withdrawal
            const withdrawal = await this.exchange.withdraw(
                "ETH",
                amount,
                this.address,
                undefined,
                {
                    network: "ArbitrumOne",
                    chain: "ArbitrumOne",
                }
            );

            logger.success(
                `${this.accountIndex} | ${
                    this.address
                } | Successfully withdrew from Bitget!`
            );

            // Wait for deposit to be received (max 7 minutes)
            const maxAttempts = 42; // 42 attempts * 10 seconds = 7 minutes
            let attempts = 0;

            while (attempts < maxAttempts) {
                const currentBalance = await provider.getBalance(this.address);

                if (currentBalance > initialBalance) {
                    const received = ethers.formatEther(
                        currentBalance - initialBalance
                    );
                    logger.success(
                        `${this.accountIndex} | ${this.address} | Deposit received: ${received} ETH`
                    );
                    break;
                }

                attempts++;
                if (attempts === maxAttempts) {
                    logger.error(
                        `${this.accountIndex} | ${this.address} | Deposit not received after 7 minutes`
                    );
                    return false;
                }

                if (attempts % 6 === 0) {
                    // Log every minute
                    logger.info(
                        `${this.accountIndex} | ${
                            this.address
                        } | Waiting for deposit... ${attempts / 6} minute(s)`
                    );
                }

                await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
            }

            await this.exchange.close();
            return true;
        } catch (error) {
            logger.error(
                `${this.accountIndex} | ${this.address} | Error withdrawing from Bitget: ${error}`
            );
            return false;
        }
    }

    private getRandomAmount(): number {
        const [min, max] = this.config.withdraw.amount;
        // Get random amount and format to 8 decimal places
        const randomAmount = Math.random() * (max - min) + min;
        return parseFloat(randomAmount.toFixed(8));
    }
}
