import { readFile } from "fs/promises";
import { checkInputPathExists, ensureOutputDirExists, main } from "./util/cliUtil";
import { consola } from "consola";
import path from "path";
import sharp from "sharp";
import fs from 'fs';
import { createCardIdToPath } from "./util/cardIdToPath";
import { cardIdsToEntries, getTotalCardQuantity, getUniqueCardIds } from "./util/decklist";
import { readDeckList, type DeckListEntry } from "./util/decklist";
import PDFDocument from 'pdfkit';

const MAX_IMAGES_PER_PAGE = 9;
const OFFSETS: number[][] = [
    [-1, -1], [0, -1], [1, -1], // Top Row (Left, Center, Right)
    [-1, 0], [0, 0], [1, 0], // Middle Row (Left, Center, Right)
    [-1, 1], [0, 1], [1, 1], // Bottom Row (Left, Center, Right)
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

let cmykMode = false;
const generatePdf = async (imageDir: string, inputPath: string, outputDir: string, outputName: string, fillBorders: boolean, gaps: boolean, allCards: boolean, diff: boolean, recursive: boolean): Promise<void> => {
    if (gaps) {
        consola.info("Setting registered: Adding gaps");
    }
    if (fillBorders) {
        consola.info("Setting registered: Filling borders");
    }
    if (allCards) {
        consola.info("Setting registered: Printing all cards");
    }
    if (diff && !inputPath) {
        inputPath = "./generated/tracked_changes/AddedOrUpdated.txt"
    }
    checkInputPathExists(imageDir);
    if (allCards) {
        inputPath = "./generated/decklists/Deck_All.txt";
    }
    if (!allCards) {
        if (!inputPath) {
            consola.error("You must specify an input path with --input, or use --diff or --all.");
            return;
        }
        checkInputPathExists(inputPath);
    }

    const cardIdToPath = await createCardIdToPath(imageDir, recursive);
    if (!cardIdToPath) {
        consola.error("No valid images found");
        return;
    }

    const cardIds = Object.keys(cardIdToPath);
    consola.info(`Found ${cardIds.length} image files`);

    // Gather the desired entries
    let entries: DeckListEntry[];
    // if (allCards) {
        // consola.info(`Adding all ${cardIds.length} entries`);
        // entries = cardIdsToEntries(cardIds);
    // } else {
        consola.info(`Reading ${inputPath}`);
        entries = await readDeckList(inputPath, cardIdToPath);
    // }
    const cardIdToImageBuffer = await generateImageBuffers(cardIdToPath, entries, cmykMode);

    let numTotalCards = getTotalCardQuantity(entries);
    const numTotalPages = Math.ceil(numTotalCards / MAX_IMAGES_PER_PAGE);
    consola.log(`PDF will contain ${numTotalCards} cards total, for a total of ${numTotalPages} pages`);

    const pdfDoc = new PDFDocument({
        size: 'LETTER',
        margin: 0,
        info: {
            Title: 'Meisterhau Cards',
            Author: 'DrakonForge Studios',
            Creator: 'DrakonForge Studios',
            Producer: 'PDFKit Renderer',
            CreationDate: new Date(),
            ModDate: new Date()
        }
    });
    const pageWidth = pdfDoc.page.width;
    const pageHeight = pdfDoc.page.height;
    if (cmykMode) {
        addPrintMetadata(pdfDoc, pageWidth, pageHeight);
    }

    const targetWidth = CARD_WIDTH_IN * INCH_TO_PDF_UNIT;
    const targetHeight = CARD_HEIGHT_IN * INCH_TO_PDF_UNIT;
    const backgroundWidth = (CARD_WIDTH_IN * 3 + (gaps ? HORIZONTAL_GAP_IN * 2 : 0)) * INCH_TO_PDF_UNIT;
    const backgroundHeight = (CARD_HEIGHT_IN * 3 + (gaps ? VERTICAL_GAP_IN * 2 : 0)) * INCH_TO_PDF_UNIT;
    consola.debug(`Card Image Dimensions: ${targetWidth} x ${targetHeight}`);

    // Start writing file
    ensureOutputDirExists(outputDir);
    const outputPath = path.join(outputDir, `${outputName}.pdf`);
    const writeStream = fs.createWriteStream(outputPath);
    pdfDoc.pipe(writeStream);

    const pdfFinished = new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
    });

    // Generate PDF
    // Reverse it to correct the order
    const entryStack = [...entries].reverse();
    let imagesOnPage = 0;
    let isFirstPage = true;
    while (entryStack.length > 0) {
        const entry = entryStack.pop();
        if (!entry) {
            continue;
        }
        const { cardId, quantity } = entry;
        let numToAdd = quantity;
        consola.debug(`Received ${cardId} x${quantity}`);

        if (isFirstPage || imagesOnPage >= MAX_IMAGES_PER_PAGE) {
            if (isFirstPage) {
                isFirstPage = false;
            } else {
                pdfDoc.addPage({ size: 'LETTER', margin: 0 });
            }

            if (fillBorders) {
                pdfDoc.rect(
                    pageWidth / 2 - backgroundWidth / 2,
                    pageHeight / 2 - backgroundHeight / 2,
                    backgroundWidth,
                    backgroundHeight
                );
                if (cmykMode) {
                    // Native DeviceCMYK 100% K ink pass-through array command [C, M, Y, K]
                    pdfDoc.fillColor([0, 0, 0, 100]).fill();
                } else {
                    pdfDoc.fillColor('#000000').fill();
                }
            }
            imagesOnPage = 0;
        }

        // If this would go past the page, add a new entry
        if (imagesOnPage + quantity > MAX_IMAGES_PER_PAGE) {
            numToAdd = MAX_IMAGES_PER_PAGE - imagesOnPage;
            const remaining = quantity - numToAdd;
            entryStack.push({ cardId, quantity: remaining });
        }

        consola.debug(`Adding ${cardId} x${numToAdd}`);
        for (let i = 0; i < numToAdd; ++i) {
            const imageBuffer = cardIdToImageBuffer[cardId];
            if (!imageBuffer) {
                throw new Error(`Image buffer not found for ${cardId}`);
            }
            const offset = OFFSETS[imagesOnPage];
            if (imagesOnPage < 0 || imagesOnPage >= MAX_IMAGES_PER_PAGE) {
                throw new Error(`Invalid imagesOnPage index: ${imagesOnPage}`);
            }
            if (!offset || offset[0] == null || offset[1] == null) {
                throw new Error(`Invalid offset for ${imagesOnPage}`);
            }
            const xOffset = offset[0] * (targetWidth + (gaps ? HORIZONTAL_GAP_IN * INCH_TO_PDF_UNIT : 0));
            const yOffset = offset[1] * (targetHeight + (gaps ? VERTICAL_GAP_IN * INCH_TO_PDF_UNIT : 0));
            pdfDoc.image(
                imageBuffer,
                pageWidth / 2 - targetWidth / 2 + xOffset,
                pageHeight / 2 - targetHeight / 2 + yOffset,
                {
                    width: targetWidth,
                    height: targetHeight
                }
            );
            imagesOnPage += 1;
        }
    }

    // Save PDF file
    pdfDoc.end();
    await pdfFinished;
    consola.success(`Successfully written PDF with ${numTotalPages} pages`);
}

const addPrintMetadata = (pdfDoc: typeof PDFDocument, pageWidth: number, pageHeight: number) => {
    const infoDict = pdfDoc.info as Record<string, any>;
    infoDict['GTS_PDFXVersion'] = 'PDF/X-4';
    infoDict['GTS_PDFXConformance'] = 'PDF/X-4';
    infoDict['Trapped'] = '/False';
    // TODO: PDF/X-4 may require an output intent

    // TODO: May need to set boxes differently
    pdfDoc.on('pageAdded', () => {
        // Define standard bounding limits using [X1, Y1, X2, Y2] pixel coordinate paths
        const pageDict = pdfDoc.page.dictionary as any;

        pageDict.data['MediaBox'] = [0, 0, pageWidth, pageHeight];
        pageDict.data['BleedBox'] = [0, 0, pageWidth, pageHeight];
        pageDict.data['TrimBox'] = [0, 0, pageWidth, pageHeight];
    });

    // Apply to first page too
    const firstPageDict = pdfDoc.page.dictionary as any;
    firstPageDict.data['MediaBox'] = [0, 0, pageWidth, pageHeight];
    firstPageDict.data['BleedBox'] = [0, 0, pageWidth, pageHeight];
    firstPageDict.data['TrimBox'] = [0, 0, pageWidth, pageHeight];
}

const generateImageBuffers = async (cardIdToPath: Record<string, string>, entries: DeckListEntry[], cmyk: boolean) => {
    const cardIdToImageBuffer: Record<string, Buffer> = {};
    const uniqueCardIds = getUniqueCardIds(entries);
    for (const cardId of uniqueCardIds) {
        const path = cardIdToPath[cardId];
        if (!path) {
            throw new Error(`Image not found for ${cardId}`);
        }

        const fileBytes = await readFile(path);
        let imagePipeline = sharp(fileBytes);

        if (cmyk) {
            imagePipeline = imagePipeline
                .toColorspace('srgb')
                .flatten({ background: '#000000' })
                .withMetadata({
                    orientation: 1,
                    icc: './assets/USWebCoatedSWOP.icc'
                })
                .toColorspace('cmyk')
                .jpeg({
                    quality: 100,
                    chromaSubsampling: '4:4:4'
                });
        } else {
            imagePipeline = imagePipeline
                .toColorspace('srgb')
                .flatten({ background: '#000000' })
                .jpeg({ quality: 100 });
        }

        cardIdToImageBuffer[cardId] = await imagePipeline.toBuffer();
    }
    consola.log(`Embedded ${uniqueCardIds.size} unique images into the PDF`);
    return cardIdToImageBuffer;
}

await main(async args => {
    const imageDir = args['images'] ?? "./generated/card_images";
    const inputPath = args['input'] ?? args['deck'] ?? "";
    const outputDir = args['output'] ?? "./generated/pdf";
    const outputName = args['name'] ?? "MyDeck";
    const fillBorders = args['borders'] ?? false;
    const gaps = args['gaps'] ?? false;
    const allCards = args['all'] ?? false;
    const diff = args['diff'] ?? false;
    const recursive = args['r'] ?? false;
    cmykMode = args['cmyk'] ?? args['print'] ?? false;

    await generatePdf(imageDir, inputPath, outputDir, outputName, fillBorders, gaps, allCards, diff, recursive);
});