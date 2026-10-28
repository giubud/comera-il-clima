import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const maxLines = 300;
const maxWidth = 100;

async function sourceFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)));
    else if (entry.isFile() && /\.(ts|css)$/.test(entry.name)) files.push(path);
  }
  return files.sort();
}

const files = await sourceFiles(join(process.cwd(), 'src'));
const errors: string[] = [];
for (const file of files) {
  const name = relative(process.cwd(), file);
  const lines = (await readFile(file, 'utf8')).replaceAll('\r\n', '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  if (lines.length > maxLines) errors.push(`${name}: ${lines.length} righe, massimo ${maxLines}.`);
  for (const [index, line] of lines.entries()) {
    const width = Array.from(line).length;
    if (width > maxWidth) {
      errors.push(`${name}:${index + 1}: ${width} caratteri, massimo ${maxWidth}.`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Verifica superata: ${files.length} sorgenti entro ${maxLines} righe per file`);
  console.log(`e ${maxWidth} caratteri per riga, incluse righe vuote e commenti.`);
}
