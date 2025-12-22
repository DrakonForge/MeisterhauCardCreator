import { open, readFile, writeFile } from "fs/promises";
import { checkInputPathExists, ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";
import path from "path";
import { createCardIdToPath } from "./util/cardIdToPath";
import { PageSizes, PDFDocument, PDFImage, PDFPage, rgb } from "pdf-lib";

const MAX_IMAGES_PER_PAGE = 9;
const OFFSETS: number[][] = [
    [-1, 1],
    [0, 1],
    [1, 1],
    [-1, 0],
    [0, 0],
    [1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
];

// Matching Magic card dimensions, so 2.48" x 3.46"
const CARD_WIDTH_IN = 2.48;
const CARD_HEIGHT_IN = 3.46;

const PAGE_WIDTH_IN = 8.5;
const PAGE_HEIGHT_IN = 11;
const MARGIN_IN = 0.25;

const HORIZONTAL_AVAILABLE_SPACE = PAGE_WIDTH_IN - 2 * MARGIN_IN;
const VERTICAL_AVAILABLE_SPACE = PAGE_HEIGHT_IN - 2 * MARGIN_IN;
const HORIZONTAL_GAP_IN = (HORIZONTAL_AVAILABLE_SPACE - 3 * CARD_WIDTH_IN) / 2; // 2 gaps
const VERTICAL_GAP_IN = (VERTICAL_AVAILABLE_SPACE - 3 * CARD_HEIGHT_IN) / 2; // 2 gaps

const INCH_TO_PDF_UNIT = 72; // Why does this unit even exist

interface Entry {
    cardId: string;
    quantity: number;
}

const generatePdf = async (imageDir: string, inputPath: string, outputDir: string, outputName: string, noFillBorders: boolean, noGaps: boolean, recursive: boolean): Promise<void> => {
    if (noGaps) {
        consola.info("Setting registered: No gaps");
    }
    if (noFillBorders) {
        consola.info("Setting registered: No fill borders");
    }
    checkInputPathExists(inputPath);
    checkInputPathExists(imageDir);

    const cardIdToPath = await createCardIdToPath(imageDir, recursive);
    if (!cardIdToPath) {
        consola.error("No valid images found");
        return;
    }

    consola.info(`Found ${Object.keys(cardIdToPath).length} image files`);

    // Gather the desired entries
    const entries: Entry[] = [];
    const uniqueCardIds = new Set<string>();
    let numTotalCards = 0;
    const file = await open(inputPath);
    for await (const line of file.readLines()) {
        const lineText = line.trim();

        // Skip blank lines or comments
        if (!lineText || lineText.startsWith("#")) {
            continue;
        }

        const words = line.split(' ');
        let cardId: string;
        let quantity: number;
        if (words.length > 2) {
            throw new Error("Must be in format <CardId> [Quantity]. CardId must be a single word");
        } if (words[0] && words[1]) {
            cardId = words[0];
            quantity = parseInt(words[1]);
        } else {
            cardId = lineText;
            quantity = 1;
        }

        if (!(cardId in cardIdToPath)) {
            throw new Error(`Unable to find card ID ${cardId} in provided image directory`);
        }

        entries.push({cardId, quantity});
        uniqueCardIds.add(cardId);
        numTotalCards += quantity;
    }

    const numTotalPages = Math.ceil(numTotalCards / MAX_IMAGES_PER_PAGE);
    consola.log(`PDF will contain ${numTotalCards} cards total, for a total of ${numTotalPages} pages`);

    // First embed all the images and save the references to them
    const pdfDoc = await PDFDocument.create();
    const cardIdToImage: Record<string, PDFImage> = {};
    for (const cardId of uniqueCardIds) {
        const path = cardIdToPath[cardId];
        if (!path) {
            throw new Error(`Image not found for ${cardId}`);
        }
        const imageBuffer = await readFile(path);
        const image = await pdfDoc.embedPng(imageBuffer);
        cardIdToImage[cardId] = image;
    }
    consola.log(`Embedded ${uniqueCardIds.size} unique images into the PDF`);

    // Generate PDF
    // Reverse it to correct the order
    const entryStack = entries.reverse();
    let imagesOnPage = 0;
    let currentPage: PDFPage | null = null;
    while (entryStack.length > 0) {
        const entry = entries.pop();
        if (!entry) {
            continue;
        }
        const { cardId, quantity } = entry;
        let numToAdd = quantity;
        consola.debug(`Received ${cardId} x${quantity}`);

        if (!currentPage || imagesOnPage >= MAX_IMAGES_PER_PAGE) {
            currentPage = pdfDoc.addPage(PageSizes.Letter);
            if (!noFillBorders) {
                const backgroundWidth = (CARD_WIDTH_IN * 3 + (noGaps ? 0 : HORIZONTAL_GAP_IN * 2)) * INCH_TO_PDF_UNIT;
                const backgroundHeight = (CARD_HEIGHT_IN * 3 + (noGaps ? 0 : VERTICAL_GAP_IN * 2)) * INCH_TO_PDF_UNIT;
                currentPage.drawRectangle({
                    x: currentPage.getWidth() / 2 - backgroundWidth / 2,
                    y: currentPage.getHeight() / 2 - backgroundHeight / 2,
                    width: backgroundWidth,
                    height: backgroundHeight,
                    color: rgb(0, 0, 0)
                });
            }
            imagesOnPage = 0;
        }

        // If this would go past the page, add a new entry
        if (imagesOnPage + quantity > MAX_IMAGES_PER_PAGE) {
            numToAdd = MAX_IMAGES_PER_PAGE - imagesOnPage;
            const remaining = quantity - numToAdd;
            entries.push({ cardId, quantity: remaining });
        }

        consola.debug(`Adding ${cardId} x${numToAdd}`);
        for (let i = 0; i < numToAdd; ++i) {
            const image = cardIdToImage[cardId];
            if (!image) {
                throw new Error(`Embedded image not found for ${cardId}`);
            }
            const offset = OFFSETS[imagesOnPage];
            if (imagesOnPage < 0 || imagesOnPage >= MAX_IMAGES_PER_PAGE) {
                throw new Error(`Invalid imagesOnPage index: ${imagesOnPage}`);
            }
            if (!offset || offset[0] == null || offset[1] == null) {
                throw new Error(`Invalid offset for ${imagesOnPage}`);
            }
            const imageDims = image.scaleToFit(CARD_WIDTH_IN * INCH_TO_PDF_UNIT, CARD_HEIGHT_IN * INCH_TO_PDF_UNIT); // Scale image down to right proportions
            const xOffset = offset[0] * (imageDims.width + (noGaps ? 0 : HORIZONTAL_GAP_IN * INCH_TO_PDF_UNIT));
            const yOffset = offset[1] * (imageDims.height + (noGaps ? 0 : VERTICAL_GAP_IN * INCH_TO_PDF_UNIT));
            consola.debug(`Dimensions: ${imageDims.width} x ${imageDims.height}`);
            currentPage.drawImage(image, {
                x: currentPage.getWidth() / 2 - imageDims.width / 2 + xOffset,
                y: currentPage.getHeight() / 2 - imageDims.height / 2 + yOffset,
                width: imageDims.width,
                height: imageDims.height
            });
            imagesOnPage += 1;
        }
    }

    // Save PDF file
    ensureOutputDirExists(outputDir);
    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(outputDir, `${outputName}.pdf`);
    await writeFile(outputPath, pdfBytes);
    consola.success(`Successfully written PDF with ${numTotalPages} pages`);
}

await main(async args => {
    const imageDir = args['images'] ?? "./generated/card_images";
    const inputPath = args['input'] ?? "./MeisterhauCardData/deck.txt";
    const outputDir = args['output'] ?? "./generated/pdf";
    const outputName = args['name'] ?? "MyDeck";
    const noFillBorders = args['noborder'] ?? false;
    const noGaps = args['nogaps'] ?? false;
    const recursive = args['r'] ?? false;

    await generatePdf(imageDir, inputPath, outputDir, outputName, noFillBorders, noGaps, recursive);
});