import { consola } from "consola";
import type { Keyword } from "../types/common";

export interface TextComponent {
    Type: string;
    Content: string;
}

const START_TAG = "<<";
const END_TAG = ">>";

export const convertKeywordsToJson = (keywords: Keyword[]): TextComponent[] => {
    const result: TextComponent[] = [];
    for (let i = 0; i < keywords.length; ++i) {
        const keyword = keywords[i];
        let keywordText: string;
        if (typeof keyword === "string") {
            keywordText = keyword;
        } else if(keyword) {
            keywordText = keyword.Keyword + " " + keyword.Value; // That's right, we're converting it back
        } else {
            consola.warn(`Unknown keyword entry: ${keyword} at index ${i}`);
            continue;
        }
        result.push({
            Type: "Keyword",
            Content: keywordText,
        });
        const separator = i < keywords.length - 1 ? ". " : ".";
        result.push({
            Type: "Plain",
            Content: separator
        });
    }
    return result;
}

export const convertTextToJson = (text: string): TextComponent[] => {
    let index = 0;
    const result: TextComponent[] = [];

    do {
        const startOfNextTag = text.indexOf(START_TAG, index);
        if (startOfNextTag > -1) {
            if (startOfNextTag > index) {
                result.push({
                    Type: "Plain",
                    Content: text.substring(index, startOfNextTag)
                });
            }
            index = startOfNextTag + START_TAG.length;
            const endOfNextTag = text.indexOf(END_TAG, index);
            if (endOfNextTag <= -1) {
                throw new Error("Unclosed tag");
            }
            const tagStr = text.substring(index, endOfNextTag);
            const firstSpace = tagStr.indexOf(" ");
            if (firstSpace > -1) {
                result.push({
                    Type: tagStr.substring(0, firstSpace),
                    Content: tagStr.substring(firstSpace + 1),
                });
            } else {
                result.push({
                    Type: tagStr,
                    Content: '',
                });
            }
            index = endOfNextTag + END_TAG.length;
        } else {
            // No more tags in string
            result.push({
                Type: "Plain",
                Content: text.substring(index)
            });
            index = text.length;
        }
    } while (index < text.length);

    return result;
};