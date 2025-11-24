import { consola } from "consola";
import { type TextComponent, convertTextToJson } from "../../text/converters";
import type { CardAction } from "../../types/card";
import { PlayActionType, IconAssets } from "../renderCard";


const renderJsonToHtml = (components: TextComponent[], parent: HTMLElement): void => {
    for (const component of components) {
        const span = document.createElement("span");
        // TODO: Add better type checking later
        switch (component.Type) {
            case "Plain":
                span.textContent = component.Content!;
                break;
            case "Strike":
                span.classList.add("strike");
                span.textContent = component.Content!;
                break;
            case "Range":
                span.classList.add("range");
                span.textContent = `Range ${component.Content!}`;
                break;
            case "GainStructure":
                span.classList.add("structure");
                const structureGain = parseInt(component.Content!);
                if (isNaN(structureGain)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `+${structureGain} Structure`;
                break;
            case "GainSpeed":
                span.classList.add("speed");
                const speedGain = parseInt(component.Content!);
                if (isNaN(speedGain)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `+${speedGain} Speed`;
                break;
            case "LoseStructure":
                span.classList.add("structure");
                const structureLoss = parseInt(component.Content!);
                if (isNaN(structureLoss)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `-${structureLoss} Structure`;
                break;
            case "LoseSpeed":
                span.classList.add("speed");
                const speedLoss = parseInt(component.Content!);
                if (isNaN(speedLoss)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `-${speedLoss} Speed`;
                break;
            case "Structure":
                span.classList.add("structure");
                const structure = parseInt(component.Content!);
                if (isNaN(structure)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `Structure ${structure}`;
                break;
            case "Speed":
                span.classList.add("speed");
                const speed = parseInt(component.Content!);
                if (isNaN(speed)) {
                    throw new Error("Invalid number");
                }
                span.textContent = `Speed ${speed}`;
                break;
            case "Definition":
                span.classList.add("definition");
                span.textContent = component.Content!;
                break;
            default:
                consola.warn(`Unknown text component type ${component.Type}`);
                span.classList.add("generic-highlight");
                span.textContent = component.Content!;
                break;
        }
        parent.appendChild(span);
    }
};

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
        parent.appendChild(p);
        renderJsonToHtml(jsonText, p);
    }
};
