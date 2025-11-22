import * as esbuild from 'esbuild';
import { createBuildSettings } from './settings.js';

const settings = createBuildSettings({
    platform: 'node', // May need to change this for the web build, or have multiple
    minify: true,
});

await esbuild.build(settings);