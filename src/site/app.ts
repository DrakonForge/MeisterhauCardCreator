/* Using a custom version of html-to-image to receive this fix: https://github.com/bubkoo/html-to-image/pull/547 */
import { toPng } from '@jpinsonneau/html-to-image';
import { onClick, query } from './dom';
import { clearCardView, setCardView } from './renderCard';
import { validateCardFromJson } from '../validation/validation';
import { consola } from 'consola';

const generateCardImage = (id: string) => {
    const element = document.querySelector<HTMLElement>(".card");
    if (!element) {
        throw new Error("Could not find card element.");
    }
    const displayImg = query<HTMLImageElement>(".card-display-output > img");
    if (displayImg) {
        const link = document.createElement("a");
        link.href = displayImg.src;
        link.download = `${id}.png`;
        link.click();
    }
}

const displayImage = async () => {
    const element = query(".card");
    const displayImg = query<HTMLImageElement>(".card-display-output > img");
    if (!element || !displayImg) {
        throw new Error("Could not find card or card image element.");
    }
    const dataUrl = await toPng(element);
    displayImg.src = dataUrl;
}

onClick(".update-button", () => {
    const textarea = query<HTMLInputElement>(".json-entry");
    if (textarea) {
        try {
            const rawData = JSON.parse(textarea.value);
            const card = validateCardFromJson(rawData);
            setCardView(card);
        } catch(e) {
            consola.error(e);
            return;
        }
    }
    displayImage();
});
onClick(".clear-button", () => {
    clearCardView();
});
onClick(".download-button", async () => {
    await displayImage();
    generateCardImage("MyCard");
});
