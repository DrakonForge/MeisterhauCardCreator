import { checkInputPathExists, main } from "./util/cliUtil";
import { consola } from "consola";
import path from "path";
import * as fs from "fs";
import { readdir } from "fs/promises";

const CLIENT_ID_PATH = "./MeisterhauCardData/imgurClientId.txt";

const uploadDeckImagesToImgur = async (inputDir: string, _albumId: string | null, cardBackUrl: string, recursive: boolean): Promise<void> => {
    checkInputPathExists(inputDir);

    const imgurClientId = fs.readFileSync(CLIENT_ID_PATH).toString().trim();

    let inputFiles: string[];
    try {
        inputFiles = await readdir(inputDir, { recursive });
    } catch (e) {
        consola.error("Error encountered while reading files", e);
        return;
    }

    // const uploadAlbumId = albumId ? albumId : await createNewAlbum();
    // consola.log(`Using album ID ${uploadAlbumId}`);

    // There shouldn't be too many files so let's do this synchronously
    const links: string[] = [];
    for (const file of inputFiles) {
        if (!file.endsWith(".jpg")) {
            continue;
        }
        const filePath = path.join(inputDir, file);
        consola.debug(`Processing ${filePath}`);
        const link = await uploadDeckImage(file, filePath, imgurClientId);
        links.push(link);
    }

    // TODO: Want to know: The exact URLs to copy, link to the album itself, and the number of cards in each image

    // consola.success(`Successfully uploaded ${inputFiles.length} images at https://imgur.com/a/${uploadAlbumId}`);
    consola.success(`Successfully uploaded ${inputFiles.length} images`);
    consola.log(`Card Faces:`);
    for (const link of links) {
        consola.log(`- ${link}`);
    }
    consola.log(`Card Back:\n- ${cardBackUrl}`);
}

const uploadDeckImage = async (fileName: string, inputPath: string, clientId: string) => {
    let fileData;
    try {
        fileData = fs.readFileSync(inputPath);
    } catch (e) {
        consola.error(`Error encountered while reading file data for ${inputPath}`, e);
    }

    if (!fileData) {
        return;
    }

    // Make Imgur request
    const formData = new FormData();
    formData.append("image", new Blob([fileData]), fileName);
    formData.append("type", "file");
    // formData.append("album", albumId);
    const response = await fetch("https://api.imgur.com/3/upload", {
        method: "POST",
        headers: {
            "Authorization": `Client-ID ${clientId}`,
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Failed to upload image ${inputPath}: Request failed with ${response.status}: ${response.statusText}`);
    }
    const { data } = await response.json();
    if (!data) {
        throw new Error(`Failed to upload image ${inputPath}: No data`);
    }
    consola.log(`Uploaded image to ${data.link}`);
    return data.link;
}

// Disabled since uploading to anonymous albums does not really work too well
const createNewAlbum = async (clientId: string): Promise<string> => {
    const formData = new FormData();
    formData.append("title", "Meisterhau Deck Images");
    formData.append("description", "Meisterhau deck images for use in Tabletop Simulator.");
    const response = await fetch("https://api.imgur.com/3/album", {
        method: "POST",
        headers: {
            "Authorization": `Client-ID ${clientId}`,
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Failed to create album: Request failed with ${response.status}: ${response.statusText}`);
    }
    const { data } = await response.json();
    if (!data) {
        throw new Error("Failed to create album: No data");
    }
    consola.log(data);
    return data.id;
}


await main(async args => {
    const inputDir = args['input'] ?? "./generated/deck_images";
    const recursive = args['r'] ?? false;
    const albumId = args['album'] ?? null; // Unused
    const cardBackUrl = args['back'] ?? "https://i.imgur.com/T21T6RB.png";

    await uploadDeckImagesToImgur(inputDir, albumId, cardBackUrl, recursive);
});