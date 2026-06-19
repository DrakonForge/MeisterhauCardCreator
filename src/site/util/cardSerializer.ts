import type { Card } from "../../types/card";
import type { Deck } from "../../types/common";

const deckToSerial: Record<Deck, string> = {
    "Audacity": "A",
    "Celerity": "C",
    "Fortitude": "F",
    "Insight": "N",
    "Footwork": "M",
    "Training": "P",
    "Starter": "S",
    "Token": "T"
};

const expansionToSerial: Record<string, string> = {
    "Starter": "",
    "Core": "",
    "Meyer": "MYR",
    "Fiore": "FRE",
    "HEMA": "WMA",
}

// TODO: Add support for setting a manual serial
// TODO: Add support for expansions not to override numbers
// TODO: Add support for not accidentally assigning the same card the same serial

const getSerialFor = (serials: Map<string, number>, prefix: string): number => {
    let lastSerial = serials.get(prefix);
    if (!lastSerial) {
        lastSerial = 1;
    }
    serials.set(prefix, lastSerial + 1);
    return lastSerial;
}

const getPrefixFor = (deck: Deck, expansion: string): string => {
    const expansionCode = expansionToSerial[expansion];
    if (expansionCode == null) {
        throw new Error(`Cannot generate serial for unknown expansion: ${expansion}`);
    }
    const deckCode = deckToSerial[deck];
    const prefix = expansionCode.length ? `${expansionCode} ${deckCode}` : deckCode;
    return prefix;
}

export const generateSerial = (serials: Map<string, number>, deck: Deck, expansion: string): string => {
    const prefix = getPrefixFor(deck, expansion);
    const serial = getSerialFor(serials, prefix);
    return `${prefix}${serial}`;
}