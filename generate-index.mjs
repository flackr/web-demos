import fs from 'node:fs';
import {readdir} from 'node:fs/promises'
import {join} from 'node:path';
import {execSync} from 'node:child_process'

// thx https://stackoverflow.com/a/71166133/89484
const deepReadDir = async (dirPath) => await Promise.all(
  (await readdir(dirPath, {withFileTypes: true})).map(async (dirent) => {
    const path = join(dirPath, dirent.name)
    return dirent.isDirectory() && !dirent.name.startsWith('.') ? await deepReadDir(path) : path
  }),
)

const files = (await deepReadDir('./')).flat(Number.POSITIVE_INFINITY);

const listItems = files
  .filter(file => file.endsWith('.html'))
  .map(file => {
    console.assert(fs.statSync(file)); // throw if no index.html
    return `<li><a href="${file}">${file}</li>`
});

const html = `
<!doctype html>
<style>
  head, title { display: block; font-weight: bold; margin: 8px; }
  html { font-size: 140%}
</style>
<title>web-demos index</title>
<ul>
  ${listItems.join('\n')}
</ul>
`;

fs.writeFileSync('index.html', html, 'utf-8');
console.log('Wrote:', `${process.cwd()}/index.html`);

if(process.argv.includes('--validate')) {
  const status = execSync('git status --porcelain', {encoding:'utf8'})
  if(status.trim().length > 0) {
    console.error('ERROR: Unexpected git diff after validating index:', status)
    console.error('Make sure you have run `node generate-index.mjs` to update the index page.')
    process.exit(1)
  }
}
