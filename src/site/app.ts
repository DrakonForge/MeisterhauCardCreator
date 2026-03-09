/* Using a custom version of html-to-image to receive this fix: https://github.com/bubkoo/html-to-image/pull/547 */
import { toPng } from '@jpinsonneau/html-to-image';
import { onClick, query } from './dom';
import { clearCardView, setCardView } from './renderCard';
import { validateCardFromJson } from '../validation/validation';
import { consola } from 'consola';

const SAMPLE_CARD = `{
    "Name": "Oberhau",
        "SecondaryName": "Cut From Above",
            "ActionType": "Arm",
                "Categories": [["Cut", "Oberhau"]],
                    "Tier": 0,
                        "Action": {
        "Text": "<<Strike Oberhau>> to the upper opening."
    },
    "MetaType": "None",
        "Speed": 4,
            "ChamberAction": {
        "Title": "Versetzen",
            "Text": "If you can defend with this card, do so. Gain <<GainSpeed 1>> on your next turn."
    },
    "Range": [1, 2],
        "Structure": 2,
            "ParryHeight": "High",
                "DefendAction": {
        "Title": "Counter-Cut",
            "Text": "Defend any strike at <<Range 2>>. Gain <<GainStructure 2>>. You have <<Keyword Sterck>>: Draw 1. The opponent has <<LoseArmSpeed 1>> on their next turn."
    }
}`;

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

const updateCard = (jsonStr: string): void => {
    const rawData = JSON.parse(jsonStr);
    const card = validateCardFromJson(rawData);
    setCardView(card);
};

onClick(".update-button", async () => {
    (window as any).status = "processing";
    const textarea = query<HTMLInputElement>(".json-entry");
    if (textarea) {
        try {
            updateCard(textarea.value);
        } catch(e) {
            consola.error(e);
            (window as any).status = "fail";
            (window as any).errorMessage = e instanceof Error ? e.message : e;
            return;
        }
    }
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

clearCardView();
updateCard(SAMPLE_CARD);
