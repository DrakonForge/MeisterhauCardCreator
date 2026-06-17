import { consola } from "consola";
import { type TextComponent, convertKeywordsToJson, convertTextToJson } from "../../text/converters";
import type { CardAction, Keywords } from "../../types/card";
import { TextType } from "../renderCard";
import { Assets } from "../assets";
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
    "Vulnerable": {
        Content: "Vulnerable",
        Decorator: "generic-highlight"
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
        Decorator: "generic-highlight",
    },
    "Winden": {
        Content: "Winden",
        Decorator: "structure",
    },
    "Token": {
        Content: "Token",
        Decorator: "consume",
    },
    "Guard": {
        Content: "Guard",
        Decorator: "generic-highlight",
    }
};

interface DeckEntry {
    Decorator: string;
    Icon: string;
}
const TextDeckMap: Record<string, DeckEntry> = {
    "Audacity": {
        Decorator: "deck-audacity",
        Icon: Assets.ICON_AUDACITY,
    },
    "Celerity": {
        Decorator: "deck-celerity",
        Icon: Assets.ICON_CELERITY,
    },
    "Insight": {
        Decorator: "deck-insight",
        Icon: Assets.ICON_INSIGHT,
    },
    "Fortitude": {
        Decorator: "deck-fortitude",
        Icon: Assets.ICON_FORTITUDE,
    },
    "Footwork": {
        Decorator: "deck-footwork",
        Icon: Assets.ICON_LEG_ACTION, // TODO Fix
    }
};

const PLACEHOLDER_NUMBER = "X";

const validateNumber = (str: string): void => {
    if(isNaN(parseInt(str)) && str != PLACEHOLDER_NUMBER) {
        throw new Error("Invalid number");
    }
}

const COMPONENT_TITLE_MARKER = "*";
const renderJsonToHtml = (components: TextComponent[], parent: HTMLElement): void => {
    for (const component of components) {
        const span = document.createElement("span");
        switch (component.Type) {
            case "Plain":
                span.textContent = component.Content;
                break;
            case "Strike":
                span.classList.add("strike");
                span.textContent = component.Content;
                break;
            case "Range":
                if (component.Content.length >= 3) {
                    component.Content = component.Content.replaceAll("-", "–");
                }

                const rangeIconContainer = document.createElement("span");
                rangeIconContainer.classList.add("range-icon-container");

                const rangeIcon = document.createElement("img");
                rangeIcon.classList.add("icon", "range-icon")
                rangeIcon.src = Assets.ICON_RANGE;
                rangeIconContainer.appendChild(rangeIcon);

                const rangeText = document.createElement("span");
                rangeText.classList.add("range");
                rangeText.textContent = component.Content;
                rangeText.style.fontSize = rangeStrToFontSizeText(component.Content) + "em";
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
                const flowIcon = document.createElement("img");
                flowIcon.classList.add("icon", "flow-icon")
                flowIcon.src = Assets.ICON_FLOW;
                span.appendChild(flowIcon);

                if (component.Content.includes(COMPONENT_TITLE_MARKER)) {
                    const flowText = document.createElement("span");
                    flowText.classList.add("flow-text", "component-title-marker");
                    flowText.textContent = "Flow";
                    span.appendChild(flowText);
                    span.classList.add("no-wrap"); // Needed whenever there is more than one element
                }

                if (!component.Content.includes("noarrow")) {
                    const flowArrow = document.createElement("span");
                    flowArrow.classList.add("flow-arrow");
                    flowArrow.textContent = "➛";
                    span.appendChild(flowArrow);
                    span.classList.add("no-wrap"); // Needed whenever there is more than one element
                }
                break;
            case "Dominate":
                const dominateCondition = document.createElement("span");
                dominateCondition.classList.add("dominate-condition");

                const dominateIcon = document.createElement("img");
                dominateIcon.classList.add("icon", "dominate-icon")
                dominateIcon.src = Assets.ICON_DOMINATE;
                dominateCondition.appendChild(dominateIcon);

                if (component.Content.includes(COMPONENT_TITLE_MARKER)) {
                    const dominateText = document.createElement("span");
                    dominateText.classList.add("dominate-text", "component-title-marker");
                    dominateText.textContent = "Dominate";
                    dominateCondition.appendChild(dominateText);
                    dominateCondition.classList.add("no-wrap"); // Needed whenever there is more than one element
                    span.appendChild(dominateCondition);
                    break;
                }

                const dominateArrow = document.createElement("span");
                dominateArrow.classList.add("dominate-arrow");
                dominateArrow.textContent = " ➛ ";
                dominateCondition.appendChild(dominateArrow);
                dominateCondition.classList.add("no-wrap"); // Needed whenever there is more than one element

                const dominateSection = document.createElement("div");
                dominateSection.classList.add("dominate-action");
                dominateSection.append(dominateCondition);
                const dominateContents: TextComponent[] = convertTextToJson(component.Content);
                // const dominateContentContainer = document.createElement("div");
                // dominateContentContainer.classList.add("dominate-contents")
                renderJsonToHtml(dominateContents, dominateSection);
                // dominateSection.append(dominateContentContainer);
                span.appendChild(dominateSection);
                break;
            case "Structure":
                renderAttribute2("Structure", Assets.ICON_STRUCTURE, span, component);
                break;
            case "Speed":
                renderAttribute2("Speed", Assets.ICON_SPEED, span, component);
                break;
            case "ArmSpeed":
                span.classList.add("no-wrap");
                renderAttribute2("Speed", Assets.ICON_SPEED, span, component);
                renderSpeedType(Assets.ICON_ARM_ACTION, span);
                break;
            case "LegSpeed":
                span.classList.add("no-wrap");
                renderAttribute2("Speed", Assets.ICON_SPEED, span, component);
                renderSpeedType(Assets.ICON_LEG_ACTION, span);
                break;
            case "ArmAction":
                const armActionIcon = document.createElement("img");
                armActionIcon.classList.add("icon", "arm-action-icon")
                armActionIcon.src = Assets.ICON_ARM_ACTION;
                span.appendChild(armActionIcon);
                break;
            case "LegAction":
                const legActionIcon = document.createElement("img");
                legActionIcon.classList.add("icon", "leg-action-icon")
                legActionIcon.src = Assets.ICON_ARM_ACTION;
                span.appendChild(legActionIcon);
                break;
            case "SpecialAction":
                const specialActionIcon = document.createElement("img");
                specialActionIcon.classList.add("icon", "special-action-icon")
                specialActionIcon.src = Assets.ICON_SPECIAL_ACTION;
                span.appendChild(specialActionIcon);
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
                parryIcon.src = Assets.ICON_PARRY_SMALL;
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
            case "Emphasis":
                span.classList.add("emphasis");
                const emphasisContents: TextComponent[] = convertTextToJson(component.Content);
                renderJsonToHtml(emphasisContents, span);
                // TODO: Still doesn't really work
                break;
            case "Card":
            case "Deck":
                const deckArgs = component.Content.split(' ');
                const deckName = deckArgs.shift() ?? '';
                const deckEntry = TextDeckMap[deckName as keyof typeof TextDeckMap];
                if (deckEntry) {
                    const deckIcon = document.createElement("img");
                    deckIcon.src = deckEntry.Icon;
                    deckIcon.classList.add("icon", "deck-icon", deckEntry.Decorator);
                    span.appendChild(deckIcon);
                    if (deckArgs.length) {
                        const deckText = document.createElement("span");
                        deckText.textContent = deckArgs.join(' ');
                        if (deckText.textContent === COMPONENT_TITLE_MARKER) {
                            deckText.textContent = deckName;
                            deckText.classList.add("component-title-marker");
                        }
                        deckText.classList.add("deck-text", deckEntry.Decorator);
                        span.appendChild(deckText);
                        span.classList.add("no-wrap", "deck-text-pair");
                    }
                } else {
                    consola.warn(`Unknown deck ${deckName}`);
                    span.classList.add("generic-highlight", "keyword-item");
                    span.textContent = deckName;
                }
                break;
            case "Keyword":
                const text = component.Content;
                const keyword = text.split(' ')[0] || '';
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
                let numValorIcons = 1;
                if (component.Content.length > 0) {
                    numValorIcons = parseInt(component.Content) || 1;
                    if (component.Content == "X") {
                        // TODO: Formatting if needed
                        const pushYourselfAmount = document.createElement("span");
                        pushYourselfAmount.textContent = "X";
                        span.appendChild(pushYourselfAmount);
                    }
                }

                for (let i = 0; i < numValorIcons; ++i) {
                    const pushYourselfIcon = document.createElement("img");
                    pushYourselfIcon.classList.add("icon", "valor-icon")
                    pushYourselfIcon.src = Assets.ICON_VALOR;
                    span.appendChild(pushYourselfIcon);
                }

                if (numValorIcons > 1) {
                    span.classList.add("no-wrap"); // Needed whenever there is more than one element
                }
                break;
            case "Or":
                span.textContent = "Or";
                span.classList.add("training-divider");
                break;
            case "Tier":
                const tierNumber = parseInt(component.Content);
                const tierIcon = document.createElement("img");
                if (tierNumber === 1) {
                    tierIcon.src = Assets.TIER_1_ICON;
                } else if (tierNumber === 2) {
                    tierIcon.src = Assets.TIER_2_ICON;
                } else if (tierNumber === 3) {
                    tierIcon.src = Assets.TIER_3_ICON;
                }
                tierIcon.classList.add("icon", "tier-icon");
                span.appendChild(tierIcon);
                break;
            case "PushYourself":
                let numValor = 1;
                if (component.Content.length > 0) {
                    numValor = parseInt(component.Content) || 1;
                    if (component.Content == "X") {
                        // TODO: Formatting if needed
                        const pushYourselfAmount = document.createElement("span");
                        pushYourselfAmount.textContent = "X";
                        span.appendChild(pushYourselfAmount);
                    }
                }

                for (let i = 0; i < numValor; ++i) {
                    const pushYourselfIcon = document.createElement("img");
                    pushYourselfIcon.classList.add("icon", "push-yourself-icon")
                    pushYourselfIcon.src = Assets.ICON_VALOR;
                    span.appendChild(pushYourselfIcon);
                }

                const pushYourselfArrow = document.createElement("span");
                pushYourselfArrow.classList.add("push-yourself-arrow");
                pushYourselfArrow.textContent = "➛";
                span.appendChild(pushYourselfArrow);
                span.classList.add("no-wrap"); // Needed whenever there is more than one element
                break;
            default:
                // consola.warn(`Unknown text component type ${component.Type}`);
                // span.classList.add("generic-highlight");
                // span.textContent = component.Content;
                throw new Error(`Unknown text component type "${component.Type}"`);
        }
        parent.appendChild(span);
    }
};

const renderAttribute1 = (type: "Speed" | "Structure", iconPath: string, span: HTMLSpanElement, component: TextComponent) => {
    const container = document.createElement("span");
    container.classList.add(type.toLowerCase(), "no-wrap");

    let numIcons = 1;
    if (component.Content) {
        const value = component.Content;
        validateNumber(value);
        // Rule of 3: Don't have more than 3 of the same icon repeated on screen
        const valueInt = parseInt(value);
        if (valueInt <= 3) {
            // Can repeat the icon
            numIcons = valueInt;
        } else {
            // Put the text before the icon
            const valueElement = document.createElement("span");
            valueElement.textContent = `${value} `;
            container.append(valueElement);
        }
    } else {
        numIcons = 0;
        container.textContent = type;
    }

    for (let i = 0; i < numIcons; ++i) {
        const icon = document.createElement("img");
        icon.classList.add("icon", `${type.toLowerCase()}-icon`)
        icon.src = iconPath;
        container.append(icon);
    }

    span.append(container);
};

const renderAttribute2 = (type: "Speed" | "Structure", iconPath: string, span: HTMLSpanElement, component: TextComponent) => {
    const container = document.createElement("span");
    container.classList.add(type.toLowerCase(), "no-wrap");

    const value = component.Content;
    if (value) {
        validateNumber(value);
        if (value === PLACEHOLDER_NUMBER) {
            // TODO: Support this
        } else {
            const valueInt = parseInt(value);
            container.classList.add("attribute-icon-container");
            const icon = document.createElement("img");
            icon.classList.add("icon", `${type.toLowerCase()}-icon`)
            icon.src = iconPath;
            container.append(icon);

            const labelElement = document.createElement("span");
            labelElement.classList.add("attribute-icon-label");
            labelElement.textContent = valueInt > 0 ? `+${valueInt}` : `-${Math.abs(valueInt)}`;
            container.append(labelElement);
        }
    } else {
        container.textContent = type;
    }

    span.append(container);
};

const renderAttribute3 = (type: "Speed" | "Structure", iconPath: string, span: HTMLSpanElement, component: TextComponent) => {
    span.classList.add(type.toLowerCase());
    if (component.Content) {
        const value = component.Content;
        validateNumber(value);
        span.textContent = `${value} ${type}`;
        span.classList.add("no-wrap"); // Avoid line breaks
    } else {
        span.textContent = type;
    }
};

const renderSpeedType = (iconPath: string, span: HTMLSpanElement) => {
    const text = document.createElement("span");
    text.textContent = " to ";
    const icon = document.createElement("img");
    icon.classList.add("icon");
    icon.src = iconPath;
    span.append(text, icon);
}

export const applyKeywordText = (keywords: Keywords | undefined, parent: HTMLElement) => {
    if (!keywords) {
        return;
    }
    const p = document.createElement("p");
    p.classList.add("keyword-list");
    renderJsonToHtml(convertKeywordsToJson(keywords), p);
    parent.appendChild(p);
}

export const applyActionText = (action: CardAction, parent: HTMLElement, type: TextType) => {
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

export const applySimpleText = (text: string | string[], parent: HTMLElement) => {
    let textLines: string[];
    if (typeof text === "string") {
        textLines = [text];
    } else {
        textLines = text;
    }
    applyNormalText(parent, textLines);
}

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
        parent.appendChild(document.createElement("hr"));
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
