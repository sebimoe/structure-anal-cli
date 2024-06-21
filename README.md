# `structure-anal-cli` [github](https://github.com/sebimoe/structure-anal-cli), [npm](https://www.npmjs.com/package/structure-anal-cli)

Command line utility `npx structure-anal` for analysis of fields in JSON-like data structures. 

Consumes a number of JSON-like entities and prints out a summary of fields encontered across any entities along with their unique values.

See library `structure-anal` for programmatic use: [github](https://github.com/sebimoe/structure-anal), [npm](https://www.npmjs.com/package/structure-anal).

## Options

Usage: `npx structure-anal [options...]`

|  Option                          |  Description
| -------------------------------- | ----------------------------------------------------
| -h --help                        | Show usage and examples.
| -j --json <file-path>            | Add a single json file as an input entity.
| -l --jsonl <file-path>           | Add all entries from a jsonl file as input entities.
| -d --json-dir <dir-path>         | Add all json files from a directory as input entities.
| -r --path-remove <string>        | Remove given string from a path completely.
| -p --path-collapse <string>      | Replace multiple occurances in a path with one.
| -n --no-numeric-collapse         | Don't replace numeric field keys in path with #.
| -u --max-unique-values <number>  | (def: 1000) Omit summarizing a field if it has more values.
| -c --max-display-values <number> | (def: 10) Limit of displayed values for each field.
| -q --omit-too-many-values        | Don't display fields which had too many unique values.
| -o --omit-object-only-entries    | Don't display fields '[object]'-only fields (children shown).
| -m --multiple-lines              | Display each field summary on several lines for readability.


- At least one of `--json`, `--jsonl` or `--json-dir` must be provided to specify input files.
- `--path-remove` is useful for de-hoisting fields into their parent, for example in recursive structures where you want to collapse all children into the root.
- `--path-collapse` is useful for recursively nested objects which do not share structure with the parent. It removes repetitions of nested path.
- Both `--path-remove` and `--path-collapse` account for arrays, replacing `.ARG` and `.ARG.#`
- If you get `too many unique values` for a field set `--max-unique-values` to a higher number.

## Usage examples

### Example: **simple.jsonl**

```json
{ "id": 1, "color": "red", "scores": [1, 3, 5, 6, 7, 8] }
{ "id": 2, "color": "green", "scores": null, "noScores": true }
{ "id": 3, "color": "blue", "scores": [1, 2, 3, 4, 5, 6] }
{ "id": 4, "color": "blue", "scores": [1] }
```

#### Example output

The output lines can get long, so examples here use `--multiple-lines` output formatting.

```
> npx structure-anal --jsonl simple.jsonl --multiple-lines
Processed 4 entities.

.:
4 entities, 4 occurances -
1 unique value: "[object]" (4)

.color:
4 entities, 4 occurances -
3 unique values: "blue" (2), "red" (1), "green" (1)

.id:
4 entities, 4 occurances -
4 unique values: 1 (1), 2 (1), 3 (1), 4 (1)

.noScores:
1 entities, 1 occurances -
1 unique value: true (1)

.scores:
4 entities, 4 occurances -
3 unique values: "[array(6)]" (2), null (1), "[array(1)]" (1)

.scores.#:
3 entities, 13 occurances -
8 unique values: 1 (3), 3 (2), 5 (2), 6 (2), 7 (1), 8 (1), 2 (1), 4 (1)
```

### Example: **cat_entity.json**

```json
{ 
  "name": "cat",
  "entity_properties": null,
  "children": [
    {
      "position": [1.23, 2.34],
      "model": "body",
      "children": [
        {
          "position": [3.45, 4.56],
          "model": "head",
          "children": [
            {
              "position": [5.67, 6.78],
              "model": "ears"
            }
          ]
        }
      ]
    }
  ]
}
```

#### Example output

Here we have a recursive structure containing a cat entity with nested model components. Note that the top-level entity has different structure to children.

In case the root entity contained key `root_model` instead of `children`, you would want to use `--path-remove` instead of `--path-collapse`.

```
> npx structure-anal --json cat_entity.json -mc 3 --path-collapse children
Processed 1 entities.

.:
1 entities, 1 occurances -
1 unique value: "[object]" (1)

.children:
1 entities, 3 occurances -
1 unique value: "[array(1)]" (3)

.children.#:
1 entities, 3 occurances -
1 unique value: "[object]" (3)

.children.#.model:
1 entities, 3 occurances -
3 unique values: "body" (1), "head" (1), "ears" (1)

.children.#.position:
1 entities, 3 occurances -
1 unique value: "[array(2)]" (3)

.children.#.position.#:
1 entities, 6 occurances -
6 unique values: 1.23 (1), 2.34 (1), 3.45 (1) <3 values omitted>

.entity_properties:
1 entities, 1 occurances -
1 unique value: null (1)

.name:
1 entities, 1 occurances -
1 unique value: "cat" (1)
```

### Other examples

```
structure-anal --json data/example1.json --json data/example2.json
structure-anal --omit-object-only-entries --multiple-lines --json-dir data
structure-anal -omd data
structure-anal --jsonl treeData.jsonl --path-remove children
structure-anal --jsonl entities.jsonl --path-collapse transform
```

## Contributing

Please feel free to open a pull request or an issue if you find something wrong or would like to contribute an improvement.
