const { join } = require('path');
const { pathExists, outputFile, readFile } = require('fs-extra');
const moment = require('moment');

const fetchReleases = require('./utils/fetchReleases');
const schedule = require('./utils/schedule');
const sha1 = require('./utils/sha1');

const INTERVAL_MS = 2 * 60 * 60 * 1000;
const SEGMENT_SIZE = process.env.SEGMENT_SIZE || 200;
const OUT_DIR = join(__dirname, '..', 'data');

function shortDate(date) {
  return moment.utc(date).format('YYYYMMDD');
}

schedule(async () => {
  console.log('Checking for update...');

  let releases = await fetchReleases();
  releases.reverse();

  console.log(`Fetched ${releases.length} releases`);

  let next = null;

  while (releases.length > SEGMENT_SIZE) {
    const segments = releases.slice(0, SEGMENT_SIZE);
    segments.reverse();
    releases = releases.slice(SEGMENT_SIZE);

    const json = JSON.stringify({
      data: segments,
      next: next,
    });

    const hash = sha1(json).substr(0, 8);
    const date = shortDate(segments[0].date);

    next = `${date}-${hash}`;

    const file = join(OUT_DIR, `static-${next}.json`);

    if (await pathExists(file)) {
      // console.log(`  Skipped ${next}.json`);
    } else {
      await outputFile(file, json);
      console.log(`  Generated static-${next}.json`);
    }
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
