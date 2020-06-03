const { join } = require('path');
const { pathExists, outputFile, readFile } = require('fs-extra');
const moment = require('moment');
const { uniq, sortBy } = require('lodash');

const fetchReleases = require('./utils/fetchReleases');
const fetchManifest = require('./utils/fetchManifest');
const schedule = require('./utils/schedule');
const sha1 = require('./utils/sha1');

const INTERVAL_MS = 2 * 60 * 60 * 1000;
const OUT_DIR = join(__dirname, '..', 'data');

function shortDate(date) {
  return moment.utc(date).format('YYYYMMDD');
}

function slice(array, size) {
  return {
    head: array.slice(0, size),
    tail: array.slice(size),
  };
}

async function writeFile(data, next) {
  const json = JSON.stringify({ data, next });

  const hash = sha1(json).substr(0, 8);
  const date = shortDate(data[0].date);

  const name = `${date}-${hash}`;
  const file = join(OUT_DIR, `static-${name}.json`);

  if (await pathExists(file)) {
    // console.log(`  Skipped ${next}.json`);
  } else {
    await outputFile(file, json);
    console.log(`  Generated static-${name}.json with ${data.length} releases`);
  }

  return name;
}

const manifests = [];

schedule(async () => {
  console.log('Checking for update...');

  let releases = await fetchReleases();
  console.log(`Fetched ${releases.length} releases`);

  console.log(`Fetching manifests...`);

  for (const release of releases) {
    try {
      const name = `manifest-${release.tag}`;
      const file = join(OUT_DIR, `static-${name}.json`);

      if (await pathExists(file)) {
        continue;
      }

      manifests.push(release.tag);
    } catch (e) {
      console.log(`  Error fetching manifest for ${release.tag}`);
    }
  }

  const chipsets = uniq(releases.map(({ chipset }) => chipset));
  const versions = sortBy(uniq(releases.map(({ version }) => version)), (version) => {
    const v = version.split('.');
    return parseInt(v[0]) * 10000 + parseInt(v[1]) * 100 + parseInt(v[2]);
  });

  versions.reverse();

  releases.reverse();
  let next = null;

  console.log(`Writing releases in 1000 group...`);

  while (releases.length > 1000) {
    const { head: segments, tail } = slice(releases, 1000);
    segments.reverse();
    releases = tail;
    next = await writeFile(segments, next);
  }

  console.log(`Writing releases in 500 group...`);

  while (releases.length > 500) {
    const { head: segments, tail } = slice(releases, 500);
    segments.reverse();
    releases = tail;
    next = await writeFile(segments, next);
  }

  console.log(`Writing releases in 200 group...`);

  while (releases.length > 200) {
    const { head: segments, tail } = slice(releases, 200);
    segments.reverse();
    releases = tail;
    next = await writeFile(segments, next);
  }

  console.log(`Writing releases in 60 group...`);

  while (releases.length > 60) {
    const { head: segments, tail } = slice(releases, 60);
    segments.reverse();
    releases = tail;
    next = await writeFile(segments, next);
  }

  console.log(`Writing releases in 10 group...`);

  while (releases.length > 10) {
    const { head: segments, tail } = slice(releases, 10);
    segments.reverse();
    releases = tail;
    next = await writeFile(segments, next);
  }

  console.log(`Writing remaining ${releases.length} releases...`);

  releases.reverse();

  const json = JSON.stringify({
    data: releases,
    chipsets: chipsets,
    versions: versions,
    next: next,
  });

  const file = join(OUT_DIR, 'latest.json');
  if (await pathExists(file) && (await readFile(file, 'utf8')) == json) {
    // console.log('  Skipped latest.json');
  } else {
    await outputFile(join(OUT_DIR, 'latest.json'), json);
    console.log(`  Generated latest.json with ${releases.length} releases`);
  }

  console.log('Done');
}, INTERVAL_MS);

schedule(async () => {
    const tag = manifests.shift();
    if (!tag) return;

    try {
      const name = `manifest-${tag}`;
      const file = join(OUT_DIR, `static-${name}.json`);

      if (await pathExists(file)) {
        return;
      }

      const json = JSON.stringify(await fetchManifest(tag));

      await outputFile(file, json);
      console.log(`Fetched static-${name}.json`);
    } catch (e) {
      console.log(`Error fetching manifest for ${tag}`);
    }
}, 1000);
