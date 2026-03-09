import { consola } from "consola";
import { query } from "../dom";

const MAX_FONT_SIZE = 36;
const MIN_FONT_SIZE = 24;
const FONT_SIZE_STEP = 1;

export const fitCardCategories = () => {
    const container = query(".card-type");
    const text = query(".card-category");

    if (!container || !text) {
        throw new Error("Unable to find text or text container");
    }

    // Reset to max
    text.style.fontSize = `${MAX_FONT_SIZE}px`;

    if (text.clientWidth <= container.clientWidth) {
        // No need to do anything
        consola.log("We chillin", text.clientWidth, container.clientWidth);
        return;
    }

    consola.log(`Unable to fit card title: textWidth = ${text.clientWidth}, containerWidth = ${container.clientWidth}`);

    let fontSize;
    for (fontSize = MAX_FONT_SIZE; fontSize >= MIN_FONT_SIZE; fontSize -= FONT_SIZE_STEP) {
        // Set font size
        text.style.fontSize = `${fontSize}px`;

        if (text.clientWidth < container.clientWidth) {
            consola.debug(`Found valid font size ${fontSize}`);
            break;
        }
    }

    if (fontSize < MIN_FONT_SIZE) {
        consola.warn(`Unable to find font size that fits, cannot scale`);
    } else {
        consola.log(`Resolving by setting font size to ${fontSize}`);
    }
}