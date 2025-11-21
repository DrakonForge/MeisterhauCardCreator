import esbuild from 'esbuild';
import { createBuildSettings, OUT_DIR } from './settings.js';

const settings = createBuildSettings({
    sourcemap: true,
    banner: {
        js: `new EventSource('/esbuild').addEventListener('change', () => location.reload());`,
    }
});

const ctx = await esbuild.context(settings);

await ctx.watch();

const { host, port } = await ctx.serve({
    port: 3000,
    servedir: OUT_DIR,
    fallback: OUT_DIR + "/index.html"
});

console.log(`Serving app at http://${host ?? "localhost"}:${port}.`);