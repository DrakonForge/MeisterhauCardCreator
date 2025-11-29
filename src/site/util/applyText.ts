import { consola } from "consola";
import { type TextComponent, convertKeywordsToJson, convertTextToJson } from "../../text/converters";
import type { CardAction, Keywords } from "../../types/card";
import { PlayActionType, IconAssets } from "../renderCard";

const TextKeywordMap = {
    "Swiftness": {
        Content: "Swiftness",
        Decorator: "speed",
    },
    "PointForward": {
        Content: "Point Forward",
        Decorator: "generic-highlight",
    },
    "ProtectsHands": {
        Content: "Protects Hands",
        Decorator: "generic-highlight",
    },
    "Volatile": {
        Content: "Volatile",
        Decorator: "generic-highlight",
    },
    "Overbind": {
        Content: "Overbind",
        Decorator: "structure",
    },
    "Sterck": {
        Content: "Sterck",
        Decorator: "structure"
    },
    "Swech": {
        Content: "Swech",
        Decorator: "speed"
    },
    "HandSnipe": {
        Content: "Hand Snipe",
        Decorator: "generic-highlight",
    },
    "Offline": {
        Content: "Offline",
        Decorator: "generic-highlight"
    },
    "Interrupt": {
        Content: "Interrupt",
        Decorator: "structure",
    },
    "Disengage": {
        Content: "Disengage",
        Decorator: "speed",
    },
    "Winden": {
        Content: "Winden",
        Decorator: "structure",
    }
};

const TextGuardMap = {
    "VomTag": "Vom Tag",
    "Pflug": "Pflug",
    "Ochs": "Ochs",
    "Alber": "Alber",
    "Langort": "Langort"
};

const renderJsonToHtml = (components: TextComponent[], parent: HTMLElement): void => {
    for (const component of components) {
        const span = document.createElement("span");
        // TODO: Add better type checking later
        switch (component.Type) {
            case "Plain":
                span.textContent = component.Content;
                break;
            case "Strike":
                span.classList.add("strike");
                span.textContent = component.Content;
                break;
            case "Range":
                span.classList.add("range");
                span.textContent = `Range ${component.Content}`;
                break;
            case "GainStructure":
                span.classList.add("structure");
                const structureGain = parseInt(component.Content);
                if (isNaN(structureGain)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `+${structureGain} Structure`;
                break;
            case "GainSpeed":
                span.classList.add("speed");
                const speedGain = parseInt(component.Content);
                if (isNaN(speedGain)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `+${speedGain} Speed`;
                break;
            case "GainArmSpeed":
                span.classList.add("speed");
                const armSpeedGain = parseInt(component.Content);
                if (isNaN(armSpeedGain)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `+${armSpeedGain} Arm Speed`;
                break;
            case "GainArmSpeed":
                span.classList.add("speed");
                const legSpeedGain = parseInt(component.Content);
                if (isNaN(legSpeedGain)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `+${legSpeedGain} Leg Speed`;
                break;
            case "LoseStructure":
                span.classList.add("structure");
                const structureLoss = parseInt(component.Content);
                if (isNaN(structureLoss)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `-${structureLoss} Structure`;
                break;
            case "LoseSpeed":
                span.classList.add("speed");
                const speedLoss = parseInt(component.Content);
                if (isNaN(speedLoss)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `-${speedLoss} Speed`;
                break;
            case "LoseArmSpeed":
                span.classList.add("speed");
                const armSpeedLoss = parseInt(component.Content);
                if (isNaN(armSpeedLoss)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `-${armSpeedLoss} Arm Speed`;
                break;
            case "LoseLegSpeed":
                span.classList.add("speed");
                const legSpeedLoss = parseInt(component.Content);
                if (isNaN(legSpeedLoss)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `-${legSpeedLoss} Leg Speed`;
                break;
            case "Structure":
                span.classList.add("structure");
                const structure = parseInt(component.Content);
                if (isNaN(structure)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `Structure ${structure}`;
                break;
            case "Speed":
                span.classList.add("speed");
                const speed = parseInt(component.Content);
                if (isNaN(speed)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `Speed ${speed}`;
                break;
            case "Definition":
                span.classList.add("definition");
                span.textContent = component.Content;
                break;
            case "Guard":
                span.classList.add("definition");
                const guard = component.Content;
                const guardEntry = TextGuardMap[guard as keyof typeof TextGuardMap];
                if (guardEntry) {
                    span.textContent = guardEntry;
                } else {
                    consola.warn(`Unknown guard ${guard}`);
                    span.textContent = guard;
                }
                break;
            case "Keyword":
                const text = component.Content;
                const keyword = text!.split(' ')[0] || '';
                const keywordEntry = TextKeywordMap[keyword as keyof typeof TextKeywordMap];
                if (keywordEntry) {
                    span.textContent = text.replace(keyword, keywordEntry.Content);
                    span.classList.add(keywordEntry.Decorator);
                } else {
                    consola.warn(`Unknown keyword ${keyword}`);
                    span.classList.add("generic-highlight");
                    span.textContent = text;
                }
                break;
            default:
                consola.warn(`Unknown text component type ${component.Type}`);
                span.classList.add("generic-highlight");
                span.textContent = component.Content;
                break;
        }
        parent.appendChild(span);
    }
};


export const applyKeywordText = (keywords: Keywords | undefined, parent: HTMLElement) => {
    if (!keywords) {
        return;
    }
    const p = document.createElement("p");
    p.classList.add("keyword-list");
    renderJsonToHtml(convertKeywordsToJson(keywords), p);
    parent.appendChild(p);
}

export const applyText = (action: CardAction, parent: HTMLElement, type: PlayActionType) => {
    let textLines: string[];
    if (typeof action.Text === "string") {
        textLines = [action.Text];

    } else {
        textLines = action.Text;
    }

    let isFirst = true;
    for (const textLine of textLines) {
        const p = document.createElement("p");
        const jsonText = convertTextToJson(textLine);
        if (isFirst) {
            if (type === PlayActionType.CHAMBER) {
                const icon = document.createElement("img");
                icon.classList.add("icon");
                icon.src = IconAssets.CHAMBER_ICON;
                p.appendChild(icon);
            } else if (type === PlayActionType.DEFEND) {
                const icon = document.createElement("img");
                icon.classList.add("icon");
                icon.src = IconAssets.DEFEND_ICON;
                p.appendChild(icon);
            }
            if (action.Title) {
                const title = document.createElement("span");
                title.classList.add("action-title");
                title.textContent = action.Title + ". ";
                p.appendChild(title);
            }
            isFirst = false;
        }
        renderJsonToHtml(jsonText, p);
        parent.appendChild(p);
    }
};
