import { consola } from "consola";
import { query, queryAll } from "../dom";
import { getTextContentHeight } from "../renderCard";

const MIN_GAP = 0;
const MAX_GAP = 30;
const MAX_FONT_SIZE = 36;
const MIN_FONT_SIZE = 24;
const FONT_SIZE_STEP = 2;

export const fitCardText = () => {
    const container = query(".card-text-container");
    const text = query(".card-text");

    if (!container || !text) {
        throw new Error("Unable to find text or text container");
    }

    if (text.clientHeight <= container.clientHeight) {
        // No need to do anything
        return;
    }

    consola.log(`Unable to fit content of card: textHeight = ${text.clientHeight}, containerHeight = ${container.clientHeight}`);

    // This is expensive, but not like we're doing it at runtime anyways
    // Right?
    // Well, we can cache it easily enough
    // First let's see how much content height is actually needed
    let contentHeight = getTextContentHeight(text);
    const gapRemaining = container.clientHeight - contentHeight;
    const numChildren = text.childElementCount;
    const numGaps = numChildren - 1;
    consola.debug(`contentHeight = ${contentHeight}, numGaps = ${numGaps}, gapRemaining = ${gapRemaining}`);

    // Check if we can solve this just by decreasing the gap
    if (gapRemaining >= MIN_GAP * numGaps) {
        // Excellent, let's just scale down the gap
        const idealGap = Math.floor(gapRemaining / numGaps);
        if (isNaN(idealGap) || idealGap < MIN_GAP || idealGap > MAX_GAP) {
            throw new Error("The math did not math");
        }
        text.style.gap = `${idealGap}px`;
        consola.log(`Resolving by scaling gap to ${idealGap}`);
        return;
    }

    // We cannot, so we need to scale down the text
    const icons = queryAll<HTMLImageElement>(".card-text > img.icon") || [];
    // This checks the initial font size by default, just in case
    let fontSize: number;
    for (fontSize = MAX_FONT_SIZE; fontSize >= MIN_FONT_SIZE; fontSize -= FONT_SIZE_STEP) {
        // Set font size
        const sizeText = `${fontSize}px`;
        text.style.fontSize = sizeText;

        // Set icon size
        for (let i = 0; i < icons.length; ++i) {
            const icon = icons[i];
            if (icon) {
                icon.style.width = sizeText;
                icon.style.height = sizeText;
            }
        }

        // Check content height again to see if it fits
        const newContentHeight = getTextContentHeight(text);
        if (newContentHeight < container.clientHeight) {
            consola.debug(`Found valid font size ${fontSize}`);
            break;
        }
    }

    if (fontSize < MIN_FONT_SIZE) {
        consola.warn(`Unable to find font size that fits, cannot scale`);
    } else {
        consola.log(`Resolving by setting font size to ${fontSize}`);
    }

    const newContentHeight = getTextContentHeight(text);
    const newGapRemaining = container.clientHeight - newContentHeight;
    const idealGap = Math.max(Math.min(Math.floor(newGapRemaining / numGaps), MAX_GAP), MIN_GAP); // This one is allowed to overflow since we did not validate beforehand
    consola.debug(`contentHeight = ${newContentHeight}, numGaps = ${numGaps}, gapRemaining = ${newGapRemaining}`);
    if (isNaN(idealGap)) {
        throw new Error("The math did not math");
    }
    consola.log(`Also setting gap to ${idealGap}`);
    text.style.gap = `${idealGap}px`;
};
