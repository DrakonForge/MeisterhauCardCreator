export interface TextComponent {
    Type: string;
    Content?: string;
}

const START_TAG = "<<";
const END_TAG = ">>";

export const convertTextToJson = (text: string): TextComponent[] => {
    let index = 0;
    let result: TextComponent[] = [];

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
                    Type: tagStr
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