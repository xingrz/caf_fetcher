const { join } = require('path');
const { pathExists, outputFile, readFile } = require('fs-extra');
const moment = require('moment');

const fetchReleases = require('./utils/fetchReleases');
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

schedule(async () => {
  console.log('Checking for update...');

  let releases = await fetchReleases();
  releases.reverse();

  console.log(`Fetched ${releases.length} releases`);

  let next = null;

  while (releases.length > 1000) {
    const { head: segments, tail } = slice(releases, 1000);
    segments.reverse();
    releases = tail;
    next = await writeFile(segments, next);
  }

  while (releases.length > 500) {
    const { head: segments, tail } = slice(releases, 500);
    segments.reverse();
    releases = tail;
    next = await writeFile(segments, next);
  }

  while (releases.length > 200) {
    const { head: segments, tail } = slice(releases, 200);
    segments.reverse();
    releases = tail;
    next = await writeFile(segments, next);
  }

  while (releases.length > 10) {
    const { head: segments, tail } = slice(releases, 10);
    segments.reverse();
    releases = tail;
    next = await writeFile(segments, next);
  }

  releases.reverse();

  const json = JSON.stringify({
    data: releases,
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
