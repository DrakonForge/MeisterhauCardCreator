# SwordCardCreator

A tool for creating cards for untitled Sword Card Game.

## Initial Setup (Required)

Requires:

* Node.js
  * Downloading through the Windows Installer (.msi) is easiest

Then install required dependencies.

```bash
# Install required dependencies
npm install
```

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

> Usage: `npm run image -- [--input <json_directory>] [--output <output_directory>] [--siteUrl <url>] [-r]`

Converts JSON to PNG files. Takes in a path to a folder of JSON files, validates them, then converts them into PNGs.

* Add `-r` to make it recursive, so it will look through subfolders.
* Generally, you should not specify `--siteUrl` so the local site created with `npm run serve` is used.

### `npm run serve`

> Usage: `npm run serve`

Opens the Visual Card Editor as a local site at [http://localhost:3000](http://localhost:3000/). Also **required** for image generation to work.

## Workflow 1: CSV -> JSON -> PNG Conversion

We assume you have a Google Sheets/Excel file with the proper formatting for card data.

1) Run `npm run serve` in a separate terminal window. Validate you can access [http://localhost:3000](http://localhost:3000/) in a browser.
1) Export spreadsheet as a CSV file. Grab the path to that CSV file.
1) Run `npm run csv -- --input <path_to_csv>`.
   * This will also run validation on the card data and inform you of any errors in the CSV file. Fix these and ensure that it runs successfully before moving on.
1) Run `npm run image -- --input ./generated/card_data`
   * Assumes you used the default output for the last command. Adjust this command otherwise.
   * This may take a while to finish.
1) View the cards in `./generated/card_images` or other specified output folder.

## Workflow 2: Visual Card Editor

1) Run `npm run serve` in a terminal window. You should be able to access [http://localhost:3000](http://localhost:3000/).
1) Input JSON data in the text area. You can copy-paste values from the output of `npm run csv` (see above) or write your own.
1) Click **Update** to see the card visual.
   * If there are validation errors, they will appear in the browser console.
1) Click **Download Image** to download the image.

## Other Commands

No need to worry about these unless you know what you're doing.

* `npm run schema`: Generates a [JSON schema](https://json-schema.org/) for use in other applications.
* `npm run build`: If you just want to build the TypeScript logic. Most other commands do this automatically.
* `npm run validate`: If you just want to validate a folder of JSON files. Works the same as `npm run image` but without the `--output` argument.
  * Useful if you are modifying the JSON files in-editor and want to check they are valid.
