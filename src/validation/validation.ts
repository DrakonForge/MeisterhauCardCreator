import { convertTextToJson, type TextComponent } from "../text/converters";
import { type ActionCard, ActionCardSchema, type TalentCard, type TrainingCard } from "../types/card";
import type { CardText } from "../types/common";

// TODO: Support validation for guard JSON as well

export const validateActionCard = (data: any): ActionCard => {
    const cardData = ActionCardSchema.parse(data);
    validateCardText(cardData.Action.Text, false);
    if (cardData.ActionType === "Arm") {
        validateCardText(cardData.ChamberAction?.Text)
        validateCardText(cardData.DefendAction?.Text)
    } else if (cardData.ActionType === "Leg") {
        validateCardText(cardData.ChamberAction?.Text);
    }
    return cardData;
};

export const validateTalentCard = (data: any): TalentCard => {
    return {} as TalentCard;
}

export const validateTrainingCard = (data: any): TrainingCard => {
    return {} as TrainingCard;
}

const validateCardText = (cardText: CardText | undefined, canBeOptional = true): void => {
    if (!cardText) {
        if (!canBeOptional) {
            throw new Error("Required text is missing");
        }
        return;
    }
    if (typeof cardText === "string") {
        const jsonText = convertTextToJson(cardText);
        validateJson(jsonText);
    } else {
        // It's an array
        for (const line of cardText) {
            const jsonText = convertTextToJson(line);
            validateJson(jsonText);
        }
    }
}

const validateJson = (jsonText: TextComponent[]) => {
    // Make sure it actually looks right
};