import { convertTextToJson, type TextComponent } from "../text/converters";
import { type ActionCard, ActionCardSchema, type Card, type TalentCard, TalentCardSchema, type TrainingCard, TrainingCardSchema } from "../types/card";
import type { CardText } from "../types/common";

export const validateCard = (data: any): Card => {
    if (data.Type === "Action") {
        return validateActionCard(data);
    } else if (data.Type === "Talent") {
        return validateTalentCard(data);
    } else if (data.Type === "Training") {
        return validateTrainingCard(data);
    }
    throw new Error(`Cannot validated card of unsupported type: ${data.Type}`);
}

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
    const cardData = TalentCardSchema.parse(data);
    validateCardText(cardData.Effect);
    return cardData;
}

export const validateTrainingCard = (data: any): TrainingCard => {
    const cardData = TrainingCardSchema.parse(data);
    validateCardText(cardData.Text);
    return cardData;
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