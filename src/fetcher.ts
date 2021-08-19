import { join } from 'path';
import { pathExists, outputFile, readFile } from 'fs-extra';
import { DateTime } from 'luxon';
import { uniq, sortBy } from 'lodash';

import fetchReleases, { IRelease } from './utils/fetchReleases';
import schedule from './utils/schedule';
import sha1 from './utils/sha1';

const INTERVAL_MS = 2 * 60 * 60 * 1000;
const OUT_DIR = join(__dirname, '..', 'data');

function shortDate(date: Date): string {
  return DateTime.fromJSDate(date).toFormat('yyyyLLdd');
}

function slice<T>(array: T[], size: number): { head: T[], tail: T[] } {
  return {
    head: array.slice(0, size),
    tail: array.slice(size),
  };
}

async function writeFile(data: IRelease[], next: string | null): Promise<string> {
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

schedule(async () => {
  console.log('Checking for update...');

  let releases = await fetchReleases();
  console.log(`Fetched ${releases.length} releases`);

  const chipsets = uniq(releases.map(({ chipset }) => chipset));
  const versions = sortBy(uniq(releases.map(({ version }) => version)), (version) => {
    const v = version.split('.');
    return parseInt(v[0]) * 10000 + parseInt(v[1]) * 100 + parseInt(v[2]);
  });

  versions.reverse();

  releases.reverse();
  let next: string | null = null;

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
