import type { ValueRange } from "../../types/common";

export const rangeStrToFontSizeMain = (rangeStr: string): number => {
    // 1 char -> 32
    // 2 char -> 28
    // 3 char -> 24
    return 36 - 4 * rangeStr.length;
}

export const rangeStrToFontSizeText = (rangeStr: string): number => {
    // 1 char -> 28
    // 2 char -> 24
    // 3 char -> 20
    return 32 - 4 * rangeStr.length;
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
