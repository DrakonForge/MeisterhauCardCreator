import type { ValueRange } from "../../types/common";

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
