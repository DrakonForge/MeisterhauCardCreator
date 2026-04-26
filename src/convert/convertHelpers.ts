
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
};export const validateId = (id: string, seenIds: Set<string>): void => {
    if (id.includes(' ')) {
        throw new Error(`ID cannot include spaces: ${id}`);
    }
    if (seenIds.has(id)) {
        throw new Error(`Duplicate ID found: ${id}`);
    }
    seenIds.add(id);
};

