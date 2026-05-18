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
import { Assets } from "./assets";

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
    card.classList.remove("training");

    if (type === "Talent") {
        card.classList.add("talent");
    }

    if (type === "Training") {
        card.classList.add("training");
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

const getBaseActionAsset = (deck: string): string => {
    if (deck === "Token") {
        return Assets.BASE_ACTION_TOKEN;
    } else if (deck === "Audacity") {
        return Assets.BASE_ACTION_AUDACITY;
    } else if (deck === "Celerity") {
        return Assets.BASE_ACTION_CELERITY;
    } else if (deck === "Fortitude") {
        return Assets.BASE_ACTION_FORTITUDE;
    } else if (deck === "Insight") {
        return Assets.BASE_ACTION_INSIGHT;
    } else if (deck === "Footwork") {
        return Assets.BASE_ACTION_FOOTWORK;
    }
    return Assets.BASE_ACTION_DEFAULT;
}

const setActionCardView = async(card: Card) => {
    if (card.Type !== "Action") {
        return;
    }

    setText(".card-title", card.Name);
    setBackgroundImage(".card", getBaseActionAsset(card.Deck));
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

    if (card.Deck === "Token") {
        setVisible(".card-body-background-token", true);
    }

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
    fitCardCategories(24, 36, 1);
}

const getBaseTalentAsset = (deck: string): string => {
    // TODO: Can add different borders here based on deck
    return Assets.BASE_TALENT_DEFAULT;
}

const setTalentCardView = async(card: Card) => {
    if (card.Type !== "Talent") {
        return;
    }

    setText(".card-title", card.Name);
    setText(".card-category", "Talent");
    setBackgroundImage(".card", getBaseTalentAsset(card.Deck));
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

const getBaseTrainingAsset = (deck: string): string => {
    if (deck === "Mixed") {
        return Assets.BASE_TRAINING_MIXED;
    } else if (deck === "Audacity") {
        return Assets.BASE_TRAINING_AUDACITY;
    } else if (deck === "Celerity") {
        return Assets.BASE_TRAINING_CELERITY;
    } else if (deck === "Fortitude") {
        return Assets.BASE_TRAINING_FORTITUDE;
    } else if (deck === "Insight") {
        return Assets.BASE_TRAINING_INSIGHT;
    } else if (deck === "Footwork") {
        return Assets.BASE_TRAINING_FOOTWORK;
    }
    return Assets.BASE_TRAINING_DEFAULT;
}

const setTrainingCardView = async (card: Card) => {
    if (card.Type !== "Training") {
        return;
    }
    // TODO
    setText(".card-title", card.Name);
    setText(".card-category", card.TrainingType);
    setVisible(".card-title-overlay", true);
    setBackgroundImage(".card", getBaseTrainingAsset(card.Primary));
    const textContainer = query(".card-text");
    if (!textContainer) {
        throw new Error("Unable to find text container");
    }
    applySimpleText(card.Text, textContainer);
    if (card.Flavor) {
        applyActionText({ Text: card.Flavor }, textContainer, TextType.FLAVOR);
    }

    fitCardText();
    fitCardTitle();
    fitCardCategories(24, 28, 1); // TODO: Need to improve this, make the divider height larger since 24px -> 6pt font which is yikes
}

export const setCardView = async (card: Card) => {
    clearCardView();
    setCardStyleType(card.Type);
    if (card.Type === "Action") {
        await setActionCardView(card);
    } else if (card.Type === "Talent") {
        await setTalentCardView(card);
    } else if (card.Type === "Training") {
        await setTrainingCardView(card);
    } else {
        consola.error(`Unknown card type: ${(card as Card).Type}`);
    }
};
