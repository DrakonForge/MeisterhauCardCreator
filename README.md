# SwordCardCreator

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
4) Run `npm run image`
   * Assumes you used the default output for the last command. Adjust this command otherwise.
   * This may take a while to finish.
5) View the cards in `./generated/card_images` or other specified output folder.

## Workflow 2: Visual Card Editor

1) Run `npm run serve` in a terminal window. You should be able to access [http://localhost:3000](http://localhost:3000/).
1) Input JSON data in the text area. You can copy-paste values from the output of `npm run csv` (see above) or write your own.
1) Click **Update** to see the card visual.
   * If there are validation errors, they will appear in the browser console.
1) Click **Download Image** to download the image.

## Available Commands

### Setting Parameters

All commands use test data / output directories by default. You can use parameters
to make the command read other input paths or output to different folders.

* `npm run <task>` - Runs task with default parameters
* `npm run <task> -- [...args]` - Runs task with arguments. The standalone `--` is required before sending arguments.

All commands can enable more verbose console logging by passing `-v` as an argument.

### `npm run csv`

> Usage: `npm run csv -- [--input <path_to_csv>] [--output <output_directory>]`

Converts CSV to JSON. Takes in a path to a CSV file and outputs multiple card JSON files based on the CSV data.

### `npm run image`

> Usage: `npm run image -- [--input <json_directory>] [--output <output_directory>] [--siteUrl <url>] [-r] [--sync]`

Converts JSON to PNG files. Takes in a path to a folder of JSON files, validates them, then converts them into PNGs.

* Add `-r` to make it recursive, so it will look through subfolders.
* Add `--sync` to run the synchronous implementation. Defaults to the parallelized version because it tends to be twice as fast, but synchronous can help guarantee nothing goes wrong.
* Generally, you should not specify `--siteUrl` so the local site created with `npm run serve` is used.

### `npm run serve`

> Usage: `npm run serve`

Opens the Visual Card Editor as a local site at [http://localhost:3000](http://localhost:3000/). Also **required** for image generation to work.

### `npm run deck`

> Usage: `npm run deck -- [--images <image_directory>] [--back <image_path>] [--input <input_path>] [--output <output_directory>] [-r]`

Assembles a folder of images for use with Tablestop Simulator's [custom deck builder](https://kb.tabletopsimulator.com/custom-content/custom-deck/#deck-builder), which expects a certain format.

Pass in a `deck.txt` into the input containing a list of cards. Blank spaces and lines starting with `#` are ignored. For every other line, the first word should be the ID of the card and the second word (optional) should be the quantity.

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
