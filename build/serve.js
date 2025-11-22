import esbuild from 'esbuild';
import { createBuildSettings } from './settings.js';

const OUT_DIR = "public";

const settings = createBuildSettings({
    outdir: OUT_DIR,
    entryPoints: [
        'src/site/app.ts'
    ],
    sourcemap: true,
    banner: {
        js: `new EventSource('/esbuild').addEventListener('change', () => location.reload());`,
    }
});

await esbuild.build(settings);
const ctx = await esbuild.context(settings);
await ctx.watch();

const { host, port } = await ctx.serve({
    port: 3000,
    servedir: OUT_DIR,
    fallback: OUT_DIR + "/index.html"
});

console.log(`Serving app at http://${host ?? "localhost"}:${port}.`);