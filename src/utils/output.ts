import figlet from "figlet";
import gradient from "gradient-string";
import logger from "./logger.js";
import chalk from "chalk";

/**
 * Clears the console and displays the STAR LABS logo
 */
export function showLogo(): void {
    const text = figlet.textSync("STARLABS", {
        font: "ANSI Shadow",
        horizontalLayout: "full",
    });

    // Create a cool blue gradient effect
    const logoGradient = gradient([
        { color: "#4169E1", pos: 0 }, // RoyalBlue
        { color: "#1E90FF", pos: 0.3 }, // DodgerBlue
        { color: "#00BFFF", pos: 0.6 }, // DeepSkyBlue
        { color: "#87CEEB", pos: 1 }, // SkyBlue
    ]);

    console.log("\n" + logoGradient(text) + "\n");
}

/**
 * Displays development and version information
 */
export function showDevInfo(): void {
    const devInfo = [
        "╔════════════════════════════════════════╗",
        "║         Abstract Software 2.3          ║",
        "║----------------------------------------║",
        "║                                        ║",
        "║  GitHub: https://github.com/StarLabs   ║",
        "║                                        ║",
        "║  Developer: https://t.me/StarLabsTech  ║",
        "║  Chat: https://t.me/StarLabsChat       ║",
        "║                                        ║",
        "╚════════════════════════════════════════╝",
    ];

    // Create a light blue gradient for info box
    const infoGradient = gradient([
        { color: "#00BFFF", pos: 0 }, // DeepSkyBlue
        { color: "#87CEEB", pos: 1 }, // SkyBlue
    ]);

    console.log(infoGradient(devInfo.join("\n")) + "\n");
}

/**
 * Displays a numbered menu with the provided items
 * @param menuItems - Array of menu items to display
 */
export function showMenu(menuItems: string[]): void {
    console.clear();
    console.log();

    menuItems.forEach((item, index) => {
        const menuNumber = index + 1;
        const isLastItem = menuNumber === menuItems.length;

        const menuLine = `[${chalk.hex("#4169E1")(
            menuNumber.toString()
        )}] ${chalk.hex("#1E90FF")(item)}`;

        if (isLastItem) {
            console.log(menuLine + "\n");
        } else {
            console.log(menuLine);
        }
    });
}

export function showError(message: string): void {
    logger.error(message);
}

export function showSuccess(message: string): void {
    logger.success(message);
}
