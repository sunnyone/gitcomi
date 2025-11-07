import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import packager from '@electron/packager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const releaseDir = path.join(projectRoot, 'release');
const stagingDir = path.join(releaseDir, '.staging');

async function ensureDistExists() {
  try {
    const stats = await fs.stat(distDir);
    if (!stats.isDirectory()) {
      throw new Error();
    }
  } catch {
    throw new Error('dist/ was not found. Run "npm run build" before packaging.');
  }
}

async function createRuntimePackageJson(pkg) {
  const runtimePkg = {
    name: pkg.name ?? 'gitcomi',
    productName: 'Gitcomi',
    version: pkg.version ?? '0.0.0',
    description: pkg.description ?? '',
    author: pkg.author ?? '',
    license: pkg.license ?? '',
    main: 'dist/main/main.js'
  };
  await fs.writeFile(path.join(stagingDir, 'package.json'), JSON.stringify(runtimePkg, null, 2));
}

async function prepareStagingDirectory() {
  await fs.rm(stagingDir, { recursive: true, force: true });
  await fs.mkdir(stagingDir, { recursive: true });
  await fs.cp(distDir, path.join(stagingDir, 'dist'), { recursive: true });
}

async function run() {
  await ensureDistExists();
  const rawPackageJson = await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8');
  const pkg = JSON.parse(rawPackageJson);

  await prepareStagingDirectory();
  await createRuntimePackageJson(pkg);
  await fs.mkdir(releaseDir, { recursive: true });

  const platform = process.env.PACKAGER_PLATFORMS || process.env.ELECTRON_PLATFORM || process.platform;
  const arch = process.env.PACKAGER_ARCHES || process.env.ELECTRON_ARCH || process.arch;

  const outputPaths = await packager({
    dir: stagingDir,
    out: releaseDir,
    overwrite: true,
    asar: true,
    platform,
    arch,
    appVersion: pkg.version ?? '0.0.0',
    prune: false,
    executableName: 'gitcomi'
  });

  console.log('Created package(s):');
  outputPaths.forEach((outPath) => console.log(` - ${outPath}`));
}

run()
  .catch(async (error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await fs.rm(stagingDir, { recursive: true, force: true });
  });
