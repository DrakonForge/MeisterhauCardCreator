import { toPng } from 'html-to-image';
import { onClick, query } from './dom';
import { clearCardView, setCardView } from './renderCard';
import { validateCardFromJson } from '../validation/validation';

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

const displayImage = () => {
    const element = query(".card");
    if (!element) {
        throw new Error("Could not find card element.");
    }
    toPng(element).then((dataUrl) => {
        // Display the image
        const displayImg = query<HTMLImageElement>(".card-display-output > img");
        if (!displayImg) {
            return;
        }
        displayImg.src = dataUrl;
    });
}

onClick(".update-button", () => {
    const textarea = query<HTMLInputElement>(".json-entry");
    if (textarea) {
        try {
            const rawData = JSON.parse(textarea.value);
            const card = validateCardFromJson(rawData);
            setCardView(card);
        } catch(e) {
            console.error("ERROR:",e);
            return;
        }
    }
    displayImage();
});
onClick(".clear-button", () => {
    clearCardView();
});
onClick(".download-button", () => {
    generateCardImage("MyCard");
});
