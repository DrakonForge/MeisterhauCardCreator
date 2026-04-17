import type { Card } from "../types/card";
import { setText, query, setImageUrl, getClassList, setVisible, setFontSizePx } from "./dom";
import { fitCardText } from "./util/fitCardText";
import { fitCardTitle } from "./util/fitCardTitle";
import { applyKeywordText, applyText } from "./util/applyText";
import { rangeStrToFontSizeMain, rangeToStr } from "./util/rangeUtils";
import { fitCardSubtitle } from "./util/fitCardSubtitle";
import { fitCardCategories } from "./util/fitCardCategories";
import type { ValueRange } from "../types/common";

export const Assets = {
    // Icons
    ICON_ARM_ACTION: "img/ArmActionIcon.svg",
    ICON_LEG_ACTION: "img/LegActionIcon.svg",
    ICON_SPECIAL_ACTION: "img/SpecialActionIcon.svg",
    ICON_PARRY_BOTH: "img/ParryIcon_Both.svg",
    ICON_PARRY_HIGH: "img/ParryIcon_High.svg",
    ICON_PARRY_LOW: "img/ParryIcon_Low.svg",
    ICON_PARRY_NONE: "img/ParryIcon_None.svg",
    ICON_RANGE: "img/RangeIcon.svg",
    ICON_INSTANT_INVERTED: "img/InstantIconInverted.svg",
    ICON_CHAMBER: "img/ChamberIcon.svg",
    ICON_COUNTER: "img/CounterIcon.svg",
    ICON_TOKEN: "img/TokenIcon.svg",
    ICON_DOMINATE: "img/DominateIcon.svg",
    ICON_FLOW: "img/FlowIcon.svg",
    // Borders
    BORDER_TOKEN: "img/Border_Token.svg",
    BORDER_VOR: "img/Border_Vor.svg",
    BORDER_NACH: "img/Border_Nach.svg",
    BORDER_MEISTERHAU: "img/Border_Meisterhau.svg",
    BORDER_BINDWORK: "img/Border_Bindwork.svg",
    // Tiers
    TIER_DEFAULT: "img/Tier_Default.svg",
    TIER_1: "img/Tier_1.svg",
    TIER_2: "img/Tier_2.svg",
    TIER_3: "img/Tier_3.svg",
    // Arches
    ARCH_LEFT: "img/Arch_Left.svg",
    ARCH_RIGHT: "img/Arch_Right.svg",
};

export enum TextType {
    NORMAL = "Normal",
    CHAMBER = "Chamber",
    COUNTER = "Counter",
    FLAVOR = "Flavor",
}

const clearRightArch = () => {
    setVisible(".card-arch-right-overlay", false);
    setVisible(".parry-height-icon", false);
    setVisible(".stat-structure", false);
}

const setRightArch = (structure: number) => {
    setText(".stat-structure", structure.toString());
    // Assume parry height is already set
    setVisible(".card-arch-right-overlay", true);
    setVisible(".parry-height-icon", true);
    setVisible(".stat-structure", true);
}

export const clearCardView = () => {
    setText(".card-title", "");
    setText(".card-subtitle", "");
    setText(".card-category", "");
    setText(".card-range-text", "");
    setText(".stat-speed", "–");
    setText(".stat-structure", "–");
    setImageUrl(".parry-height-icon", Assets.ICON_PARRY_NONE);
    setImageUrl(".action-type-icon", Assets.ICON_ARM_ACTION);
    setImageUrl(".card-tier-overlay", Assets.TIER_DEFAULT);
    setVisible(".card-tier-overlay", false);
    setImageUrl(".card-border-overlay", Assets.BORDER_VOR);
    setVisible(".card-border-overlay", false);
    setVisible(".card-body-background-token", false);
    clearRightArch();
    const textContainer = query(".card-text");
    if (textContainer) {
        textContainer.innerHTML = "";
    }
    getClassList(".range-icon")?.add("hidden");
    getClassList(".stat-speed.stat-speed-instant")?.add("hidden");
};

const setCardBorderFromDeck = (deck: string) => {
    if (deck === "Token") {
        setVisible(".card-body-background-token", true);
        setImageUrl(".card-border-overlay", Assets.BORDER_TOKEN);
        setVisible(".card-border-overlay", true);
    } else if (deck === "Vor") {
        setImageUrl(".card-border-overlay", Assets.BORDER_VOR);
        setVisible(".card-border-overlay", true);
    } else if (deck === "Nach") {
        setImageUrl(".card-border-overlay", Assets.BORDER_NACH);
        setVisible(".card-border-overlay", true);
    } else if (deck === "Bindwork") {
        setImageUrl(".card-border-overlay", Assets.BORDER_BINDWORK);
        setVisible(".card-border-overlay", true);
    } else if (deck === "Meisterhau") {
        setImageUrl(".card-border-overlay", Assets.BORDER_MEISTERHAU);
        setVisible(".card-border-overlay", true);
    }
}

const setCardTier = (tier: number) => {
    if (tier === 0) {
        setImageUrl(".card-tier-overlay", Assets.TIER_DEFAULT);
    } else if (tier === 1) {
        setImageUrl(".card-tier-overlay", Assets.TIER_1);
    } else if (tier === 2) {
        setImageUrl(".card-tier-overlay", Assets.TIER_2);
    } else if (tier === 3) {
        setImageUrl(".card-tier-overlay", Assets.TIER_3);
    }
    setVisible(".card-tier-overlay", true);
}

const setRangeIcon = (range: ValueRange) => {
    const rangeStr = rangeToStr(range);
    getClassList(".range-icon")?.remove("hidden");
    setText(".card-range-text", rangeStr);
    setFontSizePx(".card-range-text", rangeStrToFontSizeMain(rangeStr));
}

const setActionCardView = async(card: Card) => {
    if (card.Type !== "Action") {
        return;
    }

    setText(".card-title", card.Name);
    setCardTier(card.Tier);

    if (card.SecondaryName) {
        setText(".card-subtitle", `“${card.SecondaryName}”`);
    }

    if (card.Categories) {
        const categoryStrings: string[] = [];
        for (const category of card.Categories) {
            categoryStrings.push(category);
        }
        setText(".card-category", categoryStrings.join(" - "));
    }

    setCardBorderFromDeck(card.Deck);

    const textContainer = query(".card-text");
    if (!textContainer) {
        throw new Error("Unable to find text container");
    }
    if (card.Keywords) {
        applyKeywordText(card.Keywords, textContainer);
    }
    applyText(card.Action, textContainer, TextType.NORMAL);

    if (card.Speed) {
        setText(".stat-speed.stat-speed-text", card.Speed.toString());
    } else {
        setText(".stat-speed.stat-speed-text", "");
        getClassList(".stat-speed.stat-speed-instant")?.remove("hidden");
    }

    if (card.ActionType === "Arm") {
        setImageUrl(".action-type-icon", Assets.ICON_ARM_ACTION);
        if (card.ParryHeight === "High") {
            setImageUrl(".parry-height-icon", Assets.ICON_PARRY_HIGH);
        } else if (card.ParryHeight === "Low") {
            setImageUrl(".parry-height-icon", Assets.ICON_PARRY_LOW);
        } else if (card.ParryHeight === "Both") {
            setImageUrl(".parry-height-icon", Assets.ICON_PARRY_BOTH);
        } else if (card.ParryHeight === "None") {
            setImageUrl(".parry-height-icon", Assets.ICON_PARRY_NONE);
        }
        if (card.Structure != null) {
            setRightArch(card.Structure);
        }
        if (card.DefendAction) {
            applyText(card.DefendAction, textContainer, TextType.COUNTER);
        }
        setRangeIcon(card.Range);
    } else if (card.ActionType === "Leg") {
        setImageUrl(".action-type-icon", Assets.ICON_LEG_ACTION);
    } else if (card.ActionType === "Special") {
        setImageUrl(".action-type-icon", Assets.ICON_SPECIAL_ACTION);
    }
    if (card.ChamberAction) {
        applyText(card.ChamberAction, textContainer, TextType.CHAMBER);
    }

    if (card.Flavor) {
        applyText({ Text: card.Flavor }, textContainer, TextType.FLAVOR);
    }

    fitCardText();
    fitCardTitle();
    fitCardSubtitle();
    fitCardCategories();
}

export const setCardView = async (card: Card) => {
    clearCardView();
    if (card.Type === "Action") {
        await setActionCardView(card);
    }
};
