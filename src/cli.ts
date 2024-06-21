#!/usr/bin/env node

import arg from 'arg';
import { StructureAnalyzer, makePathReducer, printAnalyzerEntries, type StructureAnalyzerOptions } from 'structure-anal';
import { Parser, jsonDirParser, jsonParser, jsonlParser } from './parsers';

function displayHelp() {
  console.log(`
Usage: npx structure-anal [options...]
Options:
  -h --help                         Show this text and exit.
  -j --json <file-path>             Add a single json file as an input entity.
  -l --jsonl <file-path>            Add all entries from a jsonl file as input entities.
  -d --json-dir <dir-path>          Add all json files from a directory as input entities.
  -r --path-remove <string>         Remove given string from a path completely.
  -p --path-collapse <string>       Replace multiple occurances in a path with one.
  -n --no-numeric-collapse          Don't replace numeric field keys in path with #.
  -u --max-unique-values <number>   (default: 1000) 
  -c --max-display-values <number>  (default: 10)   
  -q --omit-too-many-values         Don't display fields which had too many unique values.
  -o --omit-object-only-entries     Don't display fields '[object]'-only fields (children shown).
  -m --multiple-lines               Display each field summary on several lines for readability.

At least one of --json, --jsonl or --json-dir must be provided.
--path-collapse is useful for recursively nested objects, it automatically accounts for
  objects nested in arrays too, unless -n flag is active.
--path-remove can be used to de-hoist fields to their parent object.

Examples:
structure-anal --json data/example1.json --json data/example2.json
structure-anal --omit-object-only-entries --multiple-lines --json-dir data
structure-anal -omd data
structure-anal --jsonl treeData.jsonl --path-remove children
structure-anal --jsonl entities.jsonl --path-collapse transform
`)
}

function displayUsageError(...message: string[]) {
  console.error("Error:", ...message);
  console.error("Run structure-anal --help to see usage.");
  return ExitCode.UsageError;
}

function pluralize(count: number, singular: string, plural?: string | null, includeCount = true) {
  if(plural === undefined || plural === null) plural = `${singular}s`;
  return count === 1 ? singular : (includeCount ? `${count} ${plural}` : plural);
}

export interface InputList {
  files: string[],
  parser: Parser,
}

export async function processInput(inputs: InputList[], analyzerOptions: StructureAnalyzerOptions) {
  const anal = new StructureAnalyzer(analyzerOptions);
  const callback = (data: any) => anal.processEntity(data);
  for(let { files, parser } of inputs) {
    for(let file of files) {
      await parser(file, callback);
    }
  }
  return anal;
}

export enum ExitCode {
  Ok = 0,
  UsageError = 1,
  OtherError = 2,
}

export async function main(argv: string[]): Promise<ExitCode> {

  const args = arg({
    '--help': Boolean,
    '--json': [String],
    '--jsonl': [String],
    '--json-dir': [String],
    '--path-collapse': [String],
    '--path-remove': [String],
    '--no-numeric-collapse': Boolean,
    '--max-unique-values': Number,
    '--max-display-values': Number,
    '--omit-too-many-values': Boolean,
    '--omit-object-only-entries': Boolean,
    '--multiple-lines': Boolean,
    '-h': '--help',
    '-j': '--json',
    '-l': '--jsonl',
    '-d': '--json-dir',
    '-p': '--path-collapse',
    '-r': '--path-remove',
    '-n': '--no-numeric-collapse',
    '-u': '--max-unique-values',
    '-c': '--max-display-values',
    '-q': '--omit-too-many-values',
    '-o': '--omit-object-only-entries',
    '-m': '--multiple-lines',
  });

  if(args._.length) {
    return displayUsageError(pluralize(args._.length, 'unrecognised argument') + ':', args._.join(", "));
  }

  if(args['--help']) {
    displayHelp();
    return ExitCode.Ok;
  }

  const inputLists = {
    json: { files: args['--json'] ?? [], parser: jsonParser },
    jsonl: { files: args['--jsonl'] ?? [], parser: jsonlParser },
    jsonDir: { files: args['--json-dir'] ?? [], parser: jsonDirParser },
  };

  if(Object.values(inputLists).map(list => list.files.length).reduce((a, b) => a + b) === 0) {
    return displayUsageError("No input specified. At least one of --json, --jsonl or --json-dir must be provided.");
  }

  const collapseList = args['--path-collapse'] || [];
  const removeList = args['--path-remove'] || [];
  const pathReducer = makePathReducer(collapseList, removeList);

  const anal = await processInput(Object.values(inputLists), {
    collapseNumericKeys: !args['--no-numeric-collapse'],
    maxUniqueValuesPerField: args['--max-unique-values'] ?? 1000,
    pathReducer
  });

  console.log(`Processed ${anal.entitiesProcessed} entities.\n`);

  printAnalyzerEntries(anal.sorted(), {
    omitObjectOnlyEntries: args['--omit-object-only-entries'] ?? false,
    omitTooManyValues: args['--omit-too-many-values'] ?? false,
    valueLimit: args['--max-display-values'] ?? 10,
    printFn: args['--multiple-lines'] ? parts => console.log(parts.join('\n') + '\n') : undefined,
  })
  
  return ExitCode.Ok;
}

main(process.argv)
  .then(exitCode => process.exit(exitCode))
  .catch(err => {
    console.error("An error has occured, exiting.")
    console.error(String(err));
    process.exit(ExitCode.OtherError);
  });
