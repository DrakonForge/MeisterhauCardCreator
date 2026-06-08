import type { Card } from "../../types/card";
import type { Deck } from "../../types/common";

const deckToSerial: Record<Deck, string> = {
    "Audacity": "A",
    "Celerity": "C",
    "Fortitude": "F",
    "Insight": "N",
    "Footwork": "M",
    "Training": "P",
    "Fundamentals": "S",
    "Token": "T"
};

const getSerialFor = (serials: Map<Deck, number>, deck: Deck): number => {
    let lastSerial = serials.get(deck);
    if (!lastSerial) {
        lastSerial = 1;
    }
    serials.set(deck, lastSerial + 1);
    return lastSerial;
}

export const generateSerial = (serials: Map<Deck, number>, deck: Deck): string => {
    const prefix = deckToSerial[deck];
    const serial = getSerialFor(serials, deck);
    return `${prefix}${serial}`;
}