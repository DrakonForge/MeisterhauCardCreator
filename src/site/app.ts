/* Using a custom version of html-to-image to receive this fix: https://github.com/bubkoo/html-to-image/pull/547 */
import { toPng } from '@jpinsonneau/html-to-image';
import { onClick, query } from './dom';
import { clearCardView, setCardView } from './renderCard';
import { Assets } from "./assets";
import { validateCard } from '../validation/validation';
import { consola } from 'consola';
import { delay } from "../util/delay";
import type { Card } from '../types/card';

const SAMPLE_CARD = `{
    "Name": "Oberhau",
    "Type": "Action",
    "Tier": 0,
    "ActionType": "Arm",
    "Deck": "Fundamentals",
    "Categories": ["Descending Cut"],
    "SecondaryName": "Cut From Above",
    "Action": {
        "Text": "<<Strike Cut>> to the upper opening."
    },
    "ChamberAction": {
        "Title": "Counter-Cut",
        "Text": "If your opponent is at <<Range 2+>> and threatens an attack to the upper opening, defend it. Your opponent has <<LoseArmSpeed 1>> on their next turn."
    },
    "Speed": 4,
    "Range": [1, 2],
    "Structure": 2,
    "ParryHeight": "High"
}`;

const preloadImage = (url: string) => {
    var img = new Image();
    img.src = url;
}

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
    (window as any).status = "converting to png";
    try {
        const dataUrl = await toPng(element);
        (window as any).status = "setting image src";
        displayImg.src = dataUrl;
    } catch(e) {
        (window as any).status = "fail";
    }
}

const updateCard = async (jsonStr: string): Promise<void> => {
    const rawData = JSON.parse(jsonStr);
    const card: Card = validateCard(rawData);
    await setCardView(card);
};

onClick(".update-button", async () => {
    const textarea = query<HTMLInputElement>(".json-entry");
    if (textarea) {
        try {
            (window as any).status = "updating card";
            await updateCard(textarea.value);
        } catch(e) {
            consola.error(e);
            (window as any).status = "fail";
            (window as any).errorMessage = e instanceof Error ? e.message : e;
            return;
        }
    }
    await delay(50); // We need to wait for the HTML to finish rendering
    (window as any).status = "displaying image";
    await displayImage();
    (window as any).status = "ready";
});
onClick(".clear-button", () => {
    clearCardView();
});
onClick(".download-button", async () => {
    await displayImage();
    generateCardImage("MyCard");
});

// Preload images

for (const assetUrl of Object.values(Assets)) {
    preloadImage(assetUrl);
}

(window as any).status = "page loading";
clearCardView();
// updateCard(SAMPLE_CARD);
