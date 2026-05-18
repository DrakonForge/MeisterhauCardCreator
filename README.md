# Meisterhau Card Creator

A suite of tools for creating cards for *Meisterhau!: The Duel*.

This repo provides a set of `npm` commands which can technically be adapted for any card game, or even used individually.

## Initial Setup (Required)

Requires:

* Node.js
  * Downloading through the Windows Installer (.msi) is easiest

Then install required dependencies.

```bash
# Install required dependencies
npm install
```

## Workflow 1: CSV -> JSON -> PNG Conversion

We assume you have a Google Sheets/Excel file with the proper formatting for card data, and also have access to the MeisterhauCardData repository. Otherwise, you will need to adjust some of the input paths (see the full command details below).

1) Run `npm run serve` in a separate terminal window. Validate you can access [http://localhost:3000](http://localhost:3000/) in a browser.
2) Export spreadsheet as a CSV file. Paste the contents of the csv file into `MeisterhauCardData/data.csv`.
3) Run `npm run csv`.
   * This will also run validation on the card data and inform you of any errors in the CSV file. Fix these and ensure that it runs successfully before moving on.
4) Run `npm run decklist`
   * Run `npm run decklist -- --exp Core` to generate only Core set, which will reduce the cards somewhat.
5) Run `npm run image -- --chunked --chunk 10`
   * Assumes you used the default output for the last command. Adjust this command otherwise.
   * This may take a while to finish. Feel free to adjust parameters to improve performance as necessary.
6) View the cards in `./generated/card_images` or other specified output folder.

## Workflow 2: Create Deck in Tabletop Simulator

1) Run Workflow 1 to generate the card images.
2) Run `npm run tts` to generate the stitched deck images in `./generated/deck_images`. You may need to modify `--include` and `--ignore` parameters to select the right decklists.
3) Run `npm run upload` to upload the deck images to Imgur. You should receive a list of links.
4) In Tabletop Simulator, go to Objects -> Components -> Custom -> Deck. Place one and wait for the menu to pop up.
5) Set the following parameters:
   * Width: 10
   * Height: 4
   * Number: 40 (if it's the last page, some may be blank)
6) Paste in the Face link and the Back link (card back should be same for every page).
7) Press **Import**.

## Workflow 3: Generate PDFs for Printing Cards

1) Run Workflow 1 to generate card images
2) Run `npm run pdf`

## Workflow 4: Visual Card Editor

1) Run `npm run serve` in a terminal window. You should be able to access [http://localhost:3000](http://localhost:3000/).
1) Input JSON data in the text area. You can copy-paste values from the output of `npm run csv` (see above) or write your own.
1) Click **Update** to see the card visual.
   * If there are validation errors, they will appear in the browser console.
1) Click **Download Image** to download the image.

## Workflow 5: Quick Iteration

Using the new diff functionality in `npm run csv`, we can quickly make changes to the spreadsheet and then only re-generate images that were changed.

1) Run `npm run serve` in a separate terminal window. Validate you can access [http://localhost:3000](http://localhost:3000/) in a browser.
2) Export spreadsheet as a CSV file. Paste the contents of the csv file into `MeisterhauCardData/data.csv`.
3) Run `npm run csv`.
   * This will also run validation on the card data and inform you of any errors in the CSV file. Fix these and ensure that it runs successfully before moving on.
4) Run `npm run image -- --chunked --chunk 10 --diff`, which should regenerate only the modified cards.
5) Run `npm run pdf -- --nogaps --diff` to view only the modified cards in a PDF.

## Available Commands

### Setting Parameters

All commands use test data / output directories by default. You can use parameters
to make the command read other input paths or output to different folders.

* `npm run <task>` - Runs task with default parameters
* `npm run <task> -- [...args]` - Runs task with arguments. The standalone `--` is required before sending arguments.

All commands can enable more verbose console logging by passing `-v` as an argument.

### `npm run csv`

> Usage: `npm run csv -- [--action <path_to_csv>] [--talent <path_to_csv>] [--training <path_to_csv>] [--diff <tracked_changes_directory>] [--nodiff] [--output <output_directory>]`

Converts CSV to JSON. Takes in a path to a CSV file and outputs multiple card JSON files based on the CSV data.

### `npm run image`

> Usage: `npm run image -- [--input <json_directory>] [--output <output_directory>] [--deck <decklist>] [--remove <decklist>] [--siteUrl <url>] [-r] [--diff] [--all] [--sync]`

Converts JSON to PNG files. Takes in a path to a folder of JSON files, validates them, then converts them into PNGs.

You need to run `npm run csv` and `npm run decklist` first.

* Add `-r` to make it recursive, so it will look through subfolders.
* Add `--sync` to run the synchronous implementation. Defaults to the parallelized version because it tends to be twice as fast, but synchronous can help guarantee nothing goes wrong.
* Add `--chunked` to run the asynchronous chunked implementation. This is parallelized but uses a persistent window for each process instead of creating new ones, leading to potential
performance benefits. You can use `--chunk` to specify number of threads/chunks, which determines chunk size. I see performance benefits typically around 10-20 threads, but this will depend on machine.
* `Add --chunk <numChunks>` to specify how many chunks, or parallel threads, should be used for the parallel and parallel chunked tasks (no effect on synchronous). Some computers will not be able to handle as many threads, and it will impact the initial startup time, but can lead to faster performance overall.
* Generally, you should not specify `--siteUrl` so the local site created with `npm run serve` is used.
* Add `--deck` to specify a specific deck path. It defaults to `Deck_All` generated by `npm run decklist`.
* Add `--diff` to only generate updated images, based on previous runs of the `npm run csv` tool. This will also remove old images.
* Add `--all` to generate ALL images in the input folder, not just locked to decklist.

### `npm run serve`

> Usage: `npm run serve`

Opens the Visual Card Editor as a local site at [http://localhost:3000](http://localhost:3000/). Also **required** for image generation to work.

### `npm run decklist`

> Usage: `npm run decklist -- [--input <input_path>] [--output <output_directory>] [--exp <expansions> [-r]`

You need to run `npm run csv` first as this uses JSON files.

Generates deck lists based on the `Deck` attribute. This can be found in `generated/decklists`.

* Provide `--exp` (or `--e`, or `--expansion`) to designate a comma-separated list of expansions
  * For example, `npm run decklist -- --exp Core` will only generate cards from the core set.

### `npm run tts`

> Usage: `npm run tts -- [--input <input_directory>] [--output <output_directory>] [--back <image_path>] [-r] [--all] [--ignore <decklists>] [--include <decklists>]`

Generates multiple stitched images of all card images in the provided directory which are compatible with Tabletop Simulator.

Each stitched image contains 40 cards. The Tabletop Simulator tool can support up to 70 per "page", but suffers from resolution issues. 10x4 fixes the vast majority of these issues.

* Add `-r` to make it recursive, so it will look through subfolders.
* Add `--ignore` and provide a comma-separated list of decklists (example: `Deck_All,DeckForbidden`) to ignore. These deck lists will not generate any images.
* Add `--include` to specifically only generate the comma-separated lists of decklists (example: `Deck_Fundamentals,Deck_Token`). If this option is specified, only these will be generated (assuming they are also not ignored).

### `npm run upload`

> Usage: `npm run upload -- [--input <input_directory>] [--back <image_url>] [-r]`

Takes in a list of deck images produced with `npm run tts` and uploads them to imgur. Provides a list of links which can easily be imported into Tabletop Simulator.

It does NOT upload the back image URL; a default link is provided but can be overridden in the command.

### `npm run pdf`

> Usage: `npm run pdf -- [--images <image_directory>][ [--input <deck_text_file>] [--output <output_directory>] [--name <deck_name>] [--noborder] [--nogaps] [--diff] [-r]`

Takes in a list of card images produced by `npm run image` and generates a pdf of the provided deck, similar to `npm run deck`. This is useful for printing decks.

* Add `--noborder` to remove the filled borders between cards, which can help save ink. These borders are usually here to make cutting out cards accept a larger margin of error.
* Add `--nogaps` to remove the gaps between the cards, so you need fewer cuts (which may require more precision) to cut out the cards.
* Use the `--input` field to control which deck displays, or one of the alternatives:
  * Use `--all` to print 1 copy of all available images.
  * Use `--diff` to view only the modified cards from `npm run csv`.

## `npm run clean`

> Usage: `npm run clean -- [-r]`

Cleans all generated data except for the `pdf` folder (which is automatically overwritten anyways).

## Deck List Format

You can define a list of cards and their quantities for use in certain commands.

Blank spaces and lines starting with `#` are ignored. For every other line, the first word should be the ID of the card and the second word (optional) should be the quantity.

Example:

```text
# Starter Pack
Oberhau
Unterhau
Mittlehau
Thrust
PushStep 4
PassStep 3
TriangleStep
```

## Other Commands

No need to worry about these unless you know what you're doing.

* `npm run schema`: Generates a [JSON schema](https://json-schema.org/) for use in other applications.
* `npm run build`: If you just want to build the TypeScript logic. Most other commands do this automatically.
* `npm run validate`: If you just want to validate a folder of JSON files. Works the same as `npm run image` but without the `--output` argument.
  * Useful if you are modifying the JSON files in-editor and want to check they are valid.
