import { type TextComponent, convertTextToJson } from "../text/converters";
import type { CardAction, Card } from "../types/card";
import type { ValueRange } from "../types/common";
import { setText, query, setImageUrl, getClassList } from "./dom";

const IconAssets = {
    ARM_ACTION: "img/ArmActionIcon.svg",
    LEG_ACTION: "img/LegActionIcon.svg",
    SPECIAL_ACTION: "img/SpecialActionIcon.svg",
    PARRY_BOTH: "img/ParryIcon_Both.svg",
    PARRY_HIGH: "img/ParryIcon_High.svg",
    PARRY_LOW: "img/ParryIcon_Low.svg",
    PARRY_NONE: "img/ParryIcon_None.svg",
    RANGE_ICON: "img/RangeIcon.svg",
    CHAMBER_ICON: "img/ChamberIcon.svg",
    DEFEND_ICON: "img/DefendIcon.svg",
};

enum PlayActionType {
    NORMAL = "Normal",
    CHAMBER = "Chamber",
    DEFEND = "Defend",
}

const rangeToStr = (range: ValueRange): string => {
    let min: number | undefined;
    let max: number | undefined;
    if (typeof range === "number") {
        min = range;
        max = range;
    } else if (Array.isArray(range)) {
        min = range[0];
        max = range[1];
    } else {
        min = range.Min;
        max = range.Max;
    }

    if (min == null && max == null) {
        throw new Error("Invalid range");
    }
    if (max != null && min == null) {
        min = 0;
    }
    if (min != null && max == null) {
        return `${min}+`;
    }
    if (min === max) {
        return `${min}`;
    }
    return `${min}-${max}`;
};

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
                console.warn(`Unknown text component type ${component.Type}`);
                span.classList.add("generic-highlight");
                span.textContent = component.Content!;
                break;
        }
        parent.appendChild(span);
    }
};

const applyText = (action: CardAction, parent: HTMLElement, type: PlayActionType) => {
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

export const clearCardView = () => {
    setText(".card-title", "");
    setText(".card-subtitle", "");
    setText(".card-category", "");
    setText(".card-range-text", "");
    setText(".stat-speed", "");
    setText(".stat-structure", "");
    setImageUrl(".parry-height-icon", IconAssets.PARRY_NONE);
    setImageUrl(".action-type-icon", IconAssets.ARM_ACTION);
    const textContainer = query(".card-text-container");
    if (textContainer) {
        textContainer.innerHTML = "";
    }
    getClassList(".range-icon")?.add("hidden");
};

export const setCardView = (card: Card) => {
    clearCardView();
    setText(".card-title", card.Name);
    if (card.SecondaryName) {
        setText(".card-subtitle", `“${card.SecondaryName}”`);
    }

    if (card.Category) {
        if (Array.isArray(card.Category)) {
            setText(".card-category", card.Category.join(" - "));
        } else {
            setText(".card-category", card.Category);
        }
    }

    const textContainer = query(".card-text-container");
    if (!textContainer) {
        throw new Error("Unable to find text container");
    }
    applyText(card.Action, textContainer, PlayActionType.NORMAL);

    if (card.ActionType === "Arm") {
        setImageUrl(".action-type-icon", IconAssets.ARM_ACTION);
        if (card.ParryHeight === "High") {
            setImageUrl(".parry-height-icon", IconAssets.PARRY_HIGH);
        } else if (card.ParryHeight === "Low") {
            setImageUrl(".parry-height-icon", IconAssets.PARRY_LOW);
        } else if (card.ParryHeight === "Both") {
            setImageUrl(".parry-height-icon", IconAssets.PARRY_BOTH);
        } else if (card.ParryHeight === "None") {
            setImageUrl(".parry-height-icon", IconAssets.PARRY_NONE);
        }
        setText(".stat-speed", card.Speed.toString());
        setText(".stat-structure", card.Structure.toString());
        if (card.DefendAction) {
            applyText(card.DefendAction, textContainer, PlayActionType.DEFEND);
        }
        if (card.ChamberAction) {
            applyText(card.ChamberAction, textContainer, PlayActionType.CHAMBER);
        }
        getClassList(".range-icon")?.remove("hidden");
        setText(".card-range-text", rangeToStr(card.Range));
    } else if (card.ActionType === "Leg") {
        setImageUrl(".action-type-icon", IconAssets.LEG_ACTION);
        setText(".stat-speed", card.Speed.toString());
        if (card.ChamberAction) {
            applyText(card.ChamberAction, textContainer, PlayActionType.CHAMBER);
        }
    } else if (card.ActionType === "Special") {
        setImageUrl(".action-type-icon", IconAssets.SPECIAL_ACTION);
    }
};
