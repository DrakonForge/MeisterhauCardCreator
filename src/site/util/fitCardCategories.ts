import { consola } from "consola";
import { query } from "../dom";

export const fitCardCategories = (minFontSize: number, maxFontSize: number, fontSizeStep: number) => {
    const container = query(".card-type");
    const text = query(".card-category");

    if (!container || !text) {
        throw new Error("Unable to find text or text container");
    }

    // Reset to max
    text.style.fontSize = `${maxFontSize}px`;

    if (text.clientWidth <= container.clientWidth) {
        // No need to do anything
        return;
    }

    consola.log(`Unable to fit card title: textWidth = ${text.clientWidth}, containerWidth = ${container.clientWidth}`);

    let fontSize;
    for (fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= fontSizeStep) {
        // Set font size
        text.style.fontSize = `${fontSize}px`;

        if (text.clientWidth < container.clientWidth) {
            consola.debug(`Found valid font size ${fontSize}`);
            break;
        }
    }

    if (fontSize < minFontSize) {
        consola.warn(`Unable to find font size that fits, cannot scale`);
    } else {
        consola.log(`Resolving by setting font size to ${fontSize}`);
    }
}