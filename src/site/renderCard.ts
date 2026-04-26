import type { Card } from "../types/card";
import { setText, query, setImageUrl, getClassList, setVisible, setFontSizePx, setBackgroundColor, setBackgroundImage } from "./dom";
import { fitCardText } from "./util/fitCardText";
import { fitCardTitle } from "./util/fitCardTitle";
import { applyKeywordText, applyActionText, applySimpleText } from "./util/applyText";
import { rangeStrToFontSizeMain, rangeToStr } from "./util/rangeUtils";
import { fitCardSubtitle } from "./util/fitCardSubtitle";
import { fitCardCategories } from "./util/fitCardCategories";
import type { ValueRange } from "../types/common";
import { consola } from "consola";

export const Assets = {
    // Icons
    ICON_ARM_ACTION: "img/ArmActionIcon.svg",
    ICON_LEG_ACTION: "img/LegActionIcon.svg",
    ICON_SPECIAL_ACTION: "img/SpecialActionIcon.svg",
    ICON_PARRY_BOTH: "img/ParryIcon_Both.svg",
    ICON_PARRY_HIGH: "img/ParryIcon_High.svg",
    ICON_PARRY_LOW: "img/ParryIcon_Low.svg",
    ICON_PARRY_NONE: "img/ParryIcon_None.svg",
    ICON_PARRY_SMALL: "img/ParryIcon_Small.svg",
    ICON_RANGE: "img/RangeIcon.svg",
    ICON_INSTANT_INVERTED: "img/InstantIconInverted.svg",
    ICON_CHAMBER: "img/ChamberIcon.svg",
    ICON_COUNTER: "img/CounterIcon.svg",
    ICON_TOKEN: "img/TokenIcon.svg",
    ICON_DOMINATE: "img/DominateIcon.svg",
    ICON_FLOW: "img/FlowIcon.svg",
    // Borders
    BORDER_TOKEN: "img/Border_Token.svg",
    BORDER_AUDACITY: "img/Border_Audacity.svg",
    BORDER_CELERITY: "img/Border_Celerity.svg",
    BORDER_INSIGHT: "img/Border_Insight.svg",
    BORDER_FORTITUDE: "img/Border_Fortitude.svg",
    BORDER_FOOTWORK: "img/Border_Footwork.svg",
    // Tiers
    TIER_0_ACTION: "img/Tier_0_Action.svg",
    TIER_1_ACTION: "img/Tier_1_Action.svg",
    TIER_2_ACTION: "img/Tier_2_Action.svg",
    TIER_3_ACTION: "img/Tier_3_Action.svg",
    TIER_0_TALENT: "img/Tier_0_Talent.svg",
    TIER_1_TALENT: "img/Tier_1_Talent.svg",
    TIER_2_TALENT: "img/Tier_2_Talent.svg",
    TIER_3_TALENT: "img/Tier_3_Talent.svg",
    // Arches and Decor
    ARCH_LEFT: "img/Arch_Left.svg",
    ARCH_RIGHT: "img/Arch_Right.svg",
    TITLE_TALENT: "img/Title_Talent.svg",
    // Frames
    FRAME_ACTION: "img/CardFrame_Action.svg",
    FRAME_TALENT: "img/CardFrame_Talent.svg",
};

export enum TextType {
    NORMAL = "Normal",
    CHAMBER = "Chamber",
    COUNTER = "Counter",
    FLAVOR = "Flavor",
}

const clearLeftArch = () => {
    setVisible(".card-arch-left-overlay", false);
    setVisible(".action-type-icon", false);
    setVisible(".stat-speed", false);
}

const clearRightArch = () => {
    setVisible(".card-arch-right-overlay", false);
    setVisible(".parry-height-icon", false);
    setVisible(".stat-structure", false);
}

const showRightArch = () => {
    setVisible(".card-arch-right-overlay", true);
    setVisible(".parry-height-icon", true);
    setVisible(".stat-structure", true);
}

const showLeftArch = () => {
    setVisible(".card-arch-left-overlay", true);
    setVisible(".action-type-icon", true);
    setVisible(".stat-speed", true);
}

const setCardStyleType = (type: string) => {
    const card = query(".card");
    if (!card) {
        throw new Error("Unable to find card class");
    }
    card.classList.remove("talent");

    if (type === "Talent") {
        card.classList.add("talent");
    }
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
    setImageUrl(".card-tier-overlay", Assets.TIER_0_ACTION);
    setVisible(".card-tier-overlay", false);
    setImageUrl(".card-border-overlay", Assets.BORDER_AUDACITY);
    setVisible(".card-border-overlay", false);
    setVisible(".card-body-background-token", false);
    setVisible(".card-title-overlay", false);
    clearLeftArch();
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
    } else if (deck === "Audacity") {
        setImageUrl(".card-border-overlay", Assets.BORDER_AUDACITY);
        setVisible(".card-border-overlay", true);
    } else if (deck === "Celerity") {
        setImageUrl(".card-border-overlay", Assets.BORDER_CELERITY);
        setVisible(".card-border-overlay", true);
    } else if (deck === "Fortitude") {
        setImageUrl(".card-border-overlay", Assets.BORDER_FORTITUDE);
        setVisible(".card-border-overlay", true);
    } else if (deck === "Insight") {
        setImageUrl(".card-border-overlay", Assets.BORDER_INSIGHT);
        setVisible(".card-border-overlay", true);
    } else if (deck === "Footwork") {
        setImageUrl(".card-border-overlay", Assets.BORDER_FOOTWORK);
        setVisible(".card-border-overlay", true);
    }
}

const ACTION_TIERS = [Assets.TIER_0_ACTION, Assets.TIER_1_ACTION, Assets.TIER_2_ACTION, Assets.TIER_3_ACTION];
const TALENT_TIERS = [Assets.TIER_0_TALENT, Assets.TIER_1_TALENT, Assets.TIER_2_TALENT, Assets.TIER_3_TALENT];
const setCardTier = (type: string, tier: number) => {
    let tierArray = ACTION_TIERS;
    if (type === "Talent") {
        tierArray = TALENT_TIERS;
    }

    let imageUrl = '';
    if (0 <= tier && tier <= 3) {
        imageUrl = tierArray[tier] ?? '';
    }

    if (imageUrl) {
        setImageUrl(".card-tier-overlay", imageUrl);
        setVisible(".card-tier-overlay", true);
    } else {
        consola.error(`Unknown tier for type: tier ${tier}, type ${type}`);
    }
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
    setBackgroundImage(".card", Assets.FRAME_ACTION);
    setCardTier(card.Type, card.Tier);
    showLeftArch();

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
    applyActionText(card.Action, textContainer, TextType.NORMAL);

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
            showRightArch();
            setText(".stat-structure", card.Structure.toString());
        }
        if (card.DefendAction) {
            applyActionText(card.DefendAction, textContainer, TextType.COUNTER);
        }
        setRangeIcon(card.Range);
    } else if (card.ActionType === "Leg") {
        setImageUrl(".action-type-icon", Assets.ICON_LEG_ACTION);
    } else if (card.ActionType === "Special") {
        setImageUrl(".action-type-icon", Assets.ICON_SPECIAL_ACTION);
    }
    if (card.ChamberAction) {
        applyActionText(card.ChamberAction, textContainer, TextType.CHAMBER);
    }

    if (card.Flavor) {
        applyActionText({ Text: card.Flavor }, textContainer, TextType.FLAVOR);
    }

    fitCardText();
    fitCardTitle();
    fitCardSubtitle();
    fitCardCategories();
}

const setTalentCardView = async(card: Card) => {
    if (card.Type !== "Talent") {
        return;
    }

    setText(".card-title", card.Name);
    setText(".card-category", "Talent");
    setBackgroundImage(".card", Assets.FRAME_TALENT);
    setCardTier(card.Type, card.Tier);
    setVisible(".card-title-overlay", true);
    const textContainer = query(".card-text");
    if (!textContainer) {
        throw new Error("Unable to find text container");
    }
    applySimpleText(card.Effect, textContainer);
    if (card.Flavor) {
        applyActionText({ Text: card.Flavor }, textContainer, TextType.FLAVOR);
    }

    fitCardText();
    fitCardTitle();
}

export const setCardView = async (card: Card) => {
    clearCardView();
    setCardStyleType(card.Type);
    if (card.Type === "Action") {
        await setActionCardView(card);
    } else if (card.Type === "Talent") {
        await setTalentCardView(card);
    } else {
        consola.error(`Unknown card type: ${card.Type}`);
    }
};
