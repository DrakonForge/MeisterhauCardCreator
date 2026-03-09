import type { Card } from "../types/card";
import { setText, query, setImageUrl, getClassList, setVisible } from "./dom";
import { fitCardText } from "./util/fitCardText";
import { fitCardTitle } from "./util/fitCardTitle";
import { applyKeywordText, applyText } from "./util/applyText";
import { rangeToStr } from "./util/rangeToStr";
import { fitCardSubtitle } from "./util/fitCardSubtitle";
import { fitCardCategories } from "./util/fitCardCategories";

export const IconAssets = {
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

export enum PlayActionType {
    NORMAL = "Normal",
    CHAMBER = "Chamber",
    DEFEND = "Defend",
}

export const clearCardView = () => {
    setText(".card-title", "");
    setText(".card-subtitle", "");
    setText(".card-category", "");
    setText(".card-range-text", "");
    setText(".stat-speed", "–");
    setText(".stat-structure", "–");
    setImageUrl(".parry-height-icon", IconAssets.PARRY_NONE);
    setImageUrl(".action-type-icon", IconAssets.ARM_ACTION);
    setVisible(".card-body-background-token", false);
    const textContainer = query(".card-text");
    if (textContainer) {
        textContainer.innerHTML = "";
    }
    getClassList(".range-icon")?.add("hidden");
    getClassList(".stat-speed.stat-speed-instant")?.add("hidden");
};

export const setCardView = (card: Card) => {
    clearCardView();
    setText(".card-title", card.Name);
    if (card.SecondaryName) {
        setText(".card-subtitle", `“${card.SecondaryName}”`);
    }

    if (card.Categories) {
        const categoryStrings: string[] = [];
        for (const category of card.Categories) {
            if (Array.isArray(category)) {
                categoryStrings.push(category.join(" - "));
            } else {
                categoryStrings.push(category);
            }
        }
        setText(".card-category", categoryStrings.join(", "));
    }

    if (card.MetaType) {
        if (card.MetaType === "Token") {
            setVisible(".card-body-background-token", true);
        }
    }

    const textContainer = query(".card-text");
    if (!textContainer) {
        throw new Error("Unable to find text container");
    }
    if (card.ActionType === "Arm" || card.ActionType === "Leg") {
        applyKeywordText(card.Keywords, textContainer);
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
        setText(".stat-speed.stat-speed-text", card.Speed.toString());
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
        setText(".stat-speed.stat-speed-text", card.Speed.toString());
        getClassList(".range-icon")?.remove("hidden");
        setText(".card-range-text", rangeToStr(card.Range));
        if (card.ChamberAction) {
            applyText(card.ChamberAction, textContainer, PlayActionType.CHAMBER);
        }
    } else if (card.ActionType === "Special") {
        setImageUrl(".action-type-icon", IconAssets.SPECIAL_ACTION);
        setText(".stat-speed.stat-speed-text", "");
        getClassList(".stat-speed.stat-speed-instant")?.remove("hidden");
    }

    fitCardText();
    fitCardTitle();
    fitCardSubtitle();
    fitCardCategories();
};
