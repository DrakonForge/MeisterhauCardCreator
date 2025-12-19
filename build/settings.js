/**
 * Sources:
 * https://eisenbergeffect.medium.com/an-esbuild-setup-for-typescript-3b24852479fe
 * https://how-to.dev/how-to-build-a-multipage-website-with-esbuild
 */

import esbuildPluginTsc from 'esbuild-plugin-tsc';

export const OUT_DIR = "dist";

export function createBuildSettings(options) {
    return {
        entryPoints: [
            'src/createSchema.ts',
            'src/validate.ts',
            'src/generateImages.ts',
            'src/convertCsv.ts',
            'src/deckBuilder.ts',
            'src/ttsImageStitcher.ts',
            'src/upload.ts',
        ],
        outdir: OUT_DIR,
        external: ["puppeteer", "sharp"], // Creates a build error if we try to bundle it
        bundle: true,
        format: "esm",
        plugins: [
            esbuildPluginTsc({
                force: true
            }),
        ],
        ...options
    };
}