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
        Decorator: "generic-highlight",
    },
    "Disengage": {
        Content: "Disengage",
        Decorator: "speed",
    },
    "Winden": {
        Content: "Winden",
        Decorator: "structure",
    },
    "Token": {
        Content: "Token",
        Decorator: "consume",
    },
    "Consume": {
        Content: "Consume",
        Decorator: "consume",
    }
};

const TextGuardMap = {
    "VomTag": "Vom Tag",
    "Pflug": "Pflug",
    "Ochs": "Ochs",
    "Alber": "Alber",
    "Langort": "Langort",
    "HighTag": "High Tag",
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
                const rangeIcon = document.createElement("img");
                rangeIcon.classList.add("icon", "range-icon")
                rangeIcon.src = "img/RangeIcon.svg";
                span.appendChild(rangeIcon);

                const rangeText = document.createElement("span");
                rangeText.classList.add("range");
                rangeText.textContent = component.Content;
                span.appendChild(rangeText);

                span.classList.add("no-wrap"); // Needed whenever there is more than one element
                break;
            case "Instant":
                const instantIcon = document.createElement("img");
                instantIcon.classList.add("icon", "instant-icon")
                instantIcon.src = "img/InstantIconInverted.svg";
                span.appendChild(instantIcon);
                break;
            case "Token":
                const tokenIcon = document.createElement("img");
                tokenIcon.classList.add("icon", "token-icon")
                tokenIcon.src = "img/TokenIcon.svg";
                span.appendChild(tokenIcon);

                const tokenText = document.createElement("span");
                tokenText.classList.add("token");
                tokenText.textContent = component.Content;
                span.appendChild(tokenText);

                span.classList.add("no-wrap"); // Needed whenever there is more than one element
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
            case "GainLegSpeed":
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
                if (component.Content) {
                    const structure = parseInt(component.Content);
                    if (isNaN(structure)) {
                        throw new Error("Invalid number");
                    }
                    span.textContent = `Structure ${structure}`;
                } else {
                    span.textContent = "Structure";
                }
                break;
            case "Speed":
                span.classList.add("speed");
                if (component.Content) {
                    const speed = parseInt(component.Content);
                    if (isNaN(speed)) {
                        throw new Error("Invalid number");
                    }
                    span.textContent = `Speed ${speed}`;
                } else {
                    span.textContent = "Speed";
                }
                break;
            case "Definition":
                span.classList.add("definition");
                span.textContent = component.Content;
                break;
            case "Move":
                span.classList.add("definition");
                span.textContent = component.Content;
                break;
            case "Strong":
                span.classList.add("structure");
                span.textContent = component.Content;
                break;
            case "Weak":
                span.classList.add("speed");
                span.textContent = component.Content;
                break;
            case "Attack":
                const attackIcon = document.createElement("img");
                attackIcon.classList.add("icon", "attack-icon")
                attackIcon.src = "img/ArmActionIcon.svg";
                span.append(attackIcon);

                const attackText = document.createElement("span");
                attackText.classList.add("attack");
                attackText.textContent = component.Content || "Attack";
                span.append(attackText);

                span.classList.add("no-wrap"); // Needed whenever there is more than one element
                break;
            case "Counter":
                const defendIcon = document.createElement("img");
                defendIcon.classList.add("icon", "defend-icon")
                defendIcon.src = "img/DefendIcon.svg";
                span.appendChild(defendIcon);

                const defendText = document.createElement("span");
                defendText.classList.add("counter");
                defendText.textContent = component.Content || "Counter";
                span.append(defendText);

                span.classList.add("no-wrap"); // Needed whenever there is more than one element
                break;
            case "Parry":
                const parryIcon = document.createElement("img");
                parryIcon.classList.add("icon", "parry-icon")
                parryIcon.src = "img/ParryIcon_Both.svg";
                span.appendChild(parryIcon);

                const parryText = document.createElement("span");
                parryText.classList.add("parry");
                parryText.textContent = component.Content || "Parry";
                span.append(parryText);

                span.classList.add("no-wrap"); // Needed whenever there is more than one element
                break;
            case "ParryHigh":
                const parryHighIcon = document.createElement("img");
                parryHighIcon.classList.add("icon", "parry-icon")
                parryHighIcon.src = "img/ParryIcon_High.svg";
                span.appendChild(parryHighIcon);

                const parryHighText = document.createElement("span");
                parryHighText.classList.add("parry");
                parryHighText.textContent = component.Content;
                span.append(parryHighText);

                span.classList.add("no-wrap"); // Needed whenever there is more than one element
                break;
            case "ParryLow":
                const parryLowIcon = document.createElement("img");
                parryLowIcon.classList.add("icon", "parry-icon")
                parryLowIcon.src = "img/ParryIcon_Low.svg";
                span.appendChild(parryLowIcon);

                const parryLowText = document.createElement("span");
                parryLowText.classList.add("parry");
                parryLowText.textContent = component.Content;
                span.append(parryLowText);

                span.classList.add("no-wrap"); // Needed whenever there is more than one element
                break;
            case "Reminder":
                span.classList.add("reminder");
                const contents: TextComponent[] = convertTextToJson(component.Content);
                renderJsonToHtml(contents, span);
                // TODO: Still doesn't really work
                break;
            case "Guard":
                // span.classList.add("definition");
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
                    span.classList.add(keywordEntry.Decorator, "keyword-item");
                } else {
                    consola.warn(`Unknown keyword ${keyword}`);
                    span.classList.add("generic-highlight", "keyword-item");
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

    if ((type === PlayActionType.CHAMBER || type === PlayActionType.DEFEND) && textLines.length > 1) {
        consola.warn("Cards with multiple lines of Defend or Chamber text are not supported");
    }

    let isFirst = true;
    for (const textLine of textLines) {
        const p = document.createElement("p");
        const jsonText = convertTextToJson(textLine);
        if (isFirst) {
            if (type === PlayActionType.CHAMBER) {
                p.classList.add("chamber-text");
                const icon = document.createElement("img");
                icon.classList.add("icon");
                icon.src = IconAssets.CHAMBER_ICON;
                p.appendChild(icon);
            } else if (type === PlayActionType.DEFEND) {
                p.classList.add("defend-text");
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
