
import { createReadStream} from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import * as readline from 'readline';

export type Parser = (path: string, callback: (data: any) => void) => Promise<void>;

export async function jsonParser(path: string, callback: (data: any) => void) {
  let text = '';
  if (path === '-') {
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) {
      text += chunk;
    }
  } else {
    text = await readFile(path, 'utf8');
  }
  const data = JSON.parse(text);
  callback(data);
}

export async function jsonlParser(path: string, callback: (data: any) => void) {
  const stream = path === '-' ? process.stdin : createReadStream(path, 'utf8');

  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if(!line?.length) return;
    const data = JSON.parse(line);
    callback(data);
  }
}

export async function jsonDirParser(path: string, callback: (data: any) => void) {
  const files = await readdir(path, { encoding: 'utf8' });
  for(let file of files) {
    const filePath = join(path, file);
    await jsonParser(filePath, callback);
  }
}

