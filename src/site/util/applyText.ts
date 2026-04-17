import { consola } from "consola";
import { type TextComponent, convertKeywordsToJson, convertTextToJson } from "../../text/converters";
import type { CardAction, Keywords } from "../../types/card";
import { TextType, Assets } from "../renderCard";
import { rangeStrToFontSizeText } from "./rangeUtils";

interface KeywordEntry {
    Content: string;
    Decorator: string;
    Icon?: string;
}
const TextKeywordMap: Record<string, KeywordEntry> = {
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
    "Redirect": {
        Content: "Redirect",
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
        // Icon: "img/TokenIcon.svg", // Can't use Assets constant for some reason, probably circular reference?
        Content: "Token",
        Decorator: "consume",
    },
};

const TextGuardMap = {
    "VomTag": "Vom Tag",
    "Pflug": "Pflug",
    "Ochs": "Ochs",
    "Alber": "Alber",
    "Langort": "Langort",
    "HighTag": "High Tag",
};

const PLACEHOLDER_NUMBER = "X";

const validateNumber = (str: string): void => {
    if(isNaN(parseInt(str)) && str != PLACEHOLDER_NUMBER) {
        throw new Error("Invalid number");
    }
}

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
                const rangeIconContainer = document.createElement("span");
                rangeIconContainer.classList.add("range-icon-container");

                const rangeIcon = document.createElement("img");
                rangeIcon.classList.add("icon", "range-icon")
                rangeIcon.src = Assets.ICON_RANGE;
                rangeIconContainer.appendChild(rangeIcon);

                const rangeText = document.createElement("span");
                rangeText.classList.add("range");
                rangeText.textContent = component.Content;
                rangeText.style.fontSize = rangeStrToFontSizeText(component.Content) + "px";
                rangeIconContainer.appendChild(rangeText);

                span.appendChild(rangeIconContainer);
                break;
            case "Instant":
                const instantIcon = document.createElement("img");
                instantIcon.classList.add("icon", "instant-icon")
                instantIcon.src = Assets.ICON_INSTANT_INVERTED;
                span.appendChild(instantIcon);
                break;
            case "Token":
                const tokenIcon = document.createElement("img");
                tokenIcon.classList.add("icon", "token-icon")
                tokenIcon.src = Assets.ICON_TOKEN;
                span.appendChild(tokenIcon);

                const tokenText = document.createElement("span");
                tokenText.classList.add("token");
                tokenText.textContent = component.Content;
                span.appendChild(tokenText);

                span.classList.add("no-wrap"); // Needed whenever there is more than one element
                break;
            case "Flow":
                // Option 1: Flow Text
                const flowText = document.createElement("span");
                flowText.textContent = "Flow:";
                flowText.classList.add("flow");
                span.appendChild(flowText);

                // Option 2: Flow Icon
                // const flowIcon = document.createElement("img");
                // flowIcon.classList.add("icon", "flow-icon")
                // flowIcon.src = Assets.ICON_FLOW;
                // span.appendChild(flowIcon);

                // if (component.Content != "noarrow") {
                //     const flowArrow = document.createElement("span");
                //     flowArrow.classList.add("flow-arrow");
                //     flowArrow.textContent = "➛";
                //     span.appendChild(flowArrow);
                //     span.classList.add("no-wrap"); // Needed whenever there is more than one element
                // }
                break;
            case "Dominate":
                const dominateIcon = document.createElement("img");
                dominateIcon.classList.add("icon", "dominate-icon")
                dominateIcon.src = Assets.ICON_DOMINATE;
                span.appendChild(dominateIcon);

                if (component.Content != "noarrow") {
                    const dominateArrow = document.createElement("span");
                    dominateArrow.classList.add("dominate-arrow");
                    dominateArrow.textContent = " ➛";
                    span.appendChild(dominateArrow);
                    span.classList.add("no-wrap"); // Needed whenever there is more than one element
                }
                break;
            case "GainStructure":
                span.classList.add("structure");
                const structureGain = component.Content;
                validateNumber(structureGain);
                span.textContent = `+${structureGain} Structure`;
                break;
            case "GainSpeed":
                span.classList.add("speed");
                const speedGain = component.Content;
                validateNumber(speedGain);
                span.textContent = `+${speedGain} All Speed`;
                break;
            case "GainArmSpeed":
                span.classList.add("speed");
                const armSpeedGain = component.Content;
                validateNumber(armSpeedGain);
                span.textContent = `+${armSpeedGain} Arm Speed`;
                break;
            case "GainLegSpeed":
                span.classList.add("speed");
                const legSpeedGain = component.Content;
                validateNumber(legSpeedGain);
                span.textContent = `+${legSpeedGain} Leg Speed`;
                break;
            case "LoseStructure":
                span.classList.add("structure");
                const structureLoss = component.Content;
                validateNumber(structureLoss);
                span.textContent = `-${structureLoss} Structure`;
                break;
            case "LoseSpeed":
                span.classList.add("speed");
                const speedLoss = component.Content;
                validateNumber(speedLoss);
                span.textContent = `-${speedLoss} All Speed`;
                break;
            case "LoseArmSpeed":
                span.classList.add("speed");
                const armSpeedLoss = component.Content;
                validateNumber(armSpeedLoss);
                span.textContent = `-${armSpeedLoss} Arm Speed`;
                break;
            case "LoseLegSpeed":
                span.classList.add("speed");
                const legSpeedLoss = component.Content;
                validateNumber(legSpeedLoss);
                span.textContent = `-${legSpeedLoss} Leg Speed`;
                break;
            case "Structure":
                span.classList.add("structure");
                if (component.Content) {
                    const structure = component.Content;
                    validateNumber(structure);
                    span.textContent = `Structure ${structure}`;
                } else {
                    span.textContent = "Structure";
                }
                break;
            case "Speed":
                span.classList.add("speed");
                if (component.Content) {
                    const speed = component.Content;
                    validateNumber(speed);
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
                attackIcon.src = Assets.ICON_ARM_ACTION;
                span.append(attackIcon);

                const attackText = document.createElement("span");
                attackText.classList.add("attack");
                attackText.textContent = component.Content || "Attack";
                span.append(attackText);

                span.classList.add("no-wrap"); // Needed whenever there is more than one element
                break;
            case "Counter":
                const counterIcon = document.createElement("img");
                counterIcon.classList.add("icon", "counter-icon")
                counterIcon.src = Assets.ICON_COUNTER;
                span.appendChild(counterIcon);

                const defendText = document.createElement("span");
                defendText.classList.add("counter");
                defendText.textContent = component.Content || "Counter";
                span.append(defendText);

                span.classList.add("no-wrap"); // Needed whenever there is more than one element
                break;
            case "Parry":
                const parryIcon = document.createElement("img");
                parryIcon.classList.add("icon", "parry-icon")
                parryIcon.src = Assets.ICON_PARRY_BOTH;
                span.appendChild(parryIcon);

                const parryText = document.createElement("span");
                parryText.classList.add("parry");
                parryText.textContent = component.Content || "Parry";
                span.append(parryText);

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
                    if (keywordEntry.Icon) {
                        const keywordIcon = document.createElement("img");
                        keywordIcon.classList.add("icon", "keyword-icon")
                        keywordIcon.src = keywordEntry.Icon;
                        span.appendChild(keywordIcon);
                        span.classList.add("no-wrap");
                    }
                    const keywordText = document.createElement("span");
                    keywordText.textContent = text.replace(keyword, keywordEntry.Content)
                    keywordText.classList.add(keywordEntry.Decorator);
                    span.appendChild(keywordText);
                    span.classList.add("keyword-item");
                } else {
                    consola.warn(`Unknown keyword ${keyword}`);
                    span.classList.add("generic-highlight", "keyword-item");
                    span.textContent = text;
                }
                break;
            case "Control":
                span.classList.add("generic-highlight");
                if (component.Content) {
                    validateNumber(component.Content);
                    span.textContent = `Control ${component.Content}`;
                } else {
                    span.textContent = "Control";
                }
                break;
            case "Valor":
                // TODO: Eventually move to an icon for valor? Magenta
                span.classList.add("generic-highlight");
                if (component.Content) {
                    validateNumber(component.Content);
                    span.textContent = `${component.Content} Valor`;
                } else {
                    span.textContent = "Valor";
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

export const applyText = (action: CardAction, parent: HTMLElement, type: TextType) => {
    let textLines: string[];
    if (typeof action.Text === "string") {
        textLines = [action.Text];
    } else {
        textLines = action.Text;
    }

    if (type === TextType.NORMAL) {
        applyNormalText(parent, textLines);
    } else if (type === TextType.CHAMBER) {
        applyChamberText(action, parent, textLines);
    } else if (type === TextType.COUNTER) {
        applyCounterText(action, parent, textLines);
    } else if (type === TextType.FLAVOR) {
        applyFlavorText(parent, textLines);
    } else {
        consola.warn(`Unknown text type ${type}`);
    }
};

const applyNormalText = (parent: HTMLElement, textLines: string[]) => {
    for (const textLine of textLines) {
        const p = document.createElement("p");
        const jsonText = convertTextToJson(textLine);
        renderJsonToHtml(jsonText, p);
        parent.appendChild(p);
    }
}

const applyFlavorText = (parent: HTMLElement, textLines: string[]) => {
    // TODO: These flavor lines should not have as large of spaces between them
    // TODO: Add handling for de-italicizing for emphasis
    for (const textLine of textLines) {
        const p = document.createElement("p");
        p.classList.add("flavor-text");
        const jsonText = convertTextToJson(textLine);
        renderJsonToHtml(jsonText, p);
        parent.appendChild(document.createElement("hr"))
        parent.appendChild(p);
    }
}

const wrapTitleText = (title: string): string => {
    if (title.endsWith('!') || title.endsWith('.') || title.endsWith('?')) {
        return title + " ";
    }
    return title + ". ";
}

const applyChamberText = (action: CardAction, parent: HTMLElement, textLines: string[]) => {
    const p = document.createElement("p");
    p.classList.add("chamber-action");
    const icon = document.createElement("img");
    icon.classList.add("icon", "chamber-icon");
    icon.src = Assets.ICON_CHAMBER;
    p.appendChild(icon);
    const textContainer = document.createElement("div");
    textContainer.classList.add("action-text-container");
    p.appendChild(textContainer);

    if (action.Title) {
        const title = document.createElement("span");
        title.classList.add("action-title");
        title.textContent = wrapTitleText(action.Title);
        textContainer.appendChild(title);
    }

    let isFirst = true;
    for (const textLine of textLines) {
        if (isFirst) {
            isFirst = false;
        } else {
            textContainer.appendChild(document.createElement("br"));
        }
        const jsonText = convertTextToJson(textLine);
        renderJsonToHtml(jsonText, textContainer);
    }

    parent.appendChild(p);
}

const applyCounterText = (action: CardAction, parent: HTMLElement, textLines: string[]) => {
    const p = document.createElement("p");
    p.classList.add("counter-action");
    const icon = document.createElement("img");
    icon.classList.add("icon", "counter-icon");
    icon.src = Assets.ICON_COUNTER;
    p.appendChild(icon);
    const textContainer = document.createElement("div");
    textContainer.classList.add("action-text-container");
    p.appendChild(textContainer);

    if (action.Title) {
        const title = document.createElement("span");
        title.classList.add("action-title");
        title.textContent = wrapTitleText(action.Title);
        textContainer.appendChild(title);
    }

    let isFirst = true;
    for (const textLine of textLines) {
        if (isFirst) {
            isFirst = false;
        } else {
            textContainer.appendChild(document.createElement("br"));
        }
        const jsonText = convertTextToJson(textLine);
        renderJsonToHtml(jsonText, textContainer);
    }
    parent.appendChild(p);
}
