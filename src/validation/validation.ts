import { type Card, CardSchema } from "../types/card";

// TODO: Support validation for guard JSON as well

export const validateCardFromJson = (data: any): Card => {
    const cardData = CardSchema.parse(data);
    return cardData;
};

// TODO: Also test for missing keys, missing behaviors, using keywords incorrectly, overlapping names, etc. as warnings
// TODO: Grammar, missing periods, etc.
// Difference between single file + group validation

// TODO: Also validate the text rendering and other properties