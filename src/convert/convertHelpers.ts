
export const parseText = (textStr: string): string | string[] => {
    const textLines = parseString(textStr).split('\n').map(str => parseString(str)).filter(str => str);
    if (!textLines.length) {
        throw new Error("Text cannot be empty");
    }
    if (textLines.length === 1) {
        return textLines[0] ?? '';
    }
    return textLines;
};

export const parseString = (str: string): string => {
    str = str.trim();
    if (str.toLowerCase() === "x") {
        return '';
    }
    return str;
};

export const validateId = (id: string, seenIds: Set<string>, name: string): void => {
    if (id.includes(' ')) {
        throw new Error(`ID cannot include spaces: ${id}`);
    }
    if (seenIds.has(id)) {
        throw new Error(`Duplicate ID found: ${id}`);
    }
    const firstUnderscore = id.indexOf('_');
    if (!firstUnderscore) {
        throw new Error(`Card lacks a card type prefix: ${id}`);
    }
    const withoutPrefix = id.substring(firstUnderscore + 1);
    if (!withoutPrefix.length || withoutPrefix.charAt(0) != name.charAt(0)) {
        throw new Error(`First letter of ID and name should match for consistency: ${id}, ${name}`);
    }
    seenIds.add(id);
};

