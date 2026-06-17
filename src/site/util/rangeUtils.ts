import type { ValueRange } from "../../types/common";

export const rangeStrToFontSizeMain = (rangeStr: string): number => {
    // 1 char -> 30
    // 2 char -> 26
    // 3 char -> 22
    return 34 - 4 * rangeStr.length;
}

export const rangeStrToFontSizeText = (rangeStr: string): number => {
    // 1 char -> 0.86em
    // 2 char -> 0.73em
    // 3 char -> 0.6em
    return 0.9 - 0.14 * rangeStr.length;
}

export const rangeToStr = (range: ValueRange): string => {
    let min: number | undefined;
    let max: number | undefined;
    if (typeof range === "number") {
        min = range;
        max = range;
    } else if (Array.isArray(range)) {
        min = range[0];
        max = range[1];
    } else {
        min = range.Min;
        max = range.Max;
    }

    if (min == null && max == null) {
        throw new Error("Invalid range");
    }
    if (max != null && min == null) {
        min = 0;
    }
    if (min != null && max == null) {
        return `${min}+`;
    }
    if (min === max) {
        return `${min}`;
    }
    return `${min}–${max}`;
};
