const rp = require('request-promise');
const moment = require('moment');

const RELEASE_URL = 'https://wiki.codeaurora.org/xwiki/rest/wikis/xwiki/spaces/QAEP/pages/release';

module.exports = async function fetchReleases() {
  const releases = [];
  const { content } = await rp.get(RELEASE_URL, { json: true });

  for (const line of content.split('\n')) {
    const fields = line.split('|');
    if (fields.length != 6) {
      continue;
    }

    const date = moment.utc(fields[1].trim(), 'MMMM DD, YYYY');
    if (!date.isValid()) {
      continue;
    }

    const release = {
      date: date.toDate(),
      tag: fields[2].trim(),
      chipset: fields[3].trim(),
      version: fields[5].trim().split('.').map(Number).join('.')
    };

    if (release.chipset == '0' || release.version == '0') {
      continue;
    }

    if (release.tag == 'LNX.LW.2.1-07600-8x26.0') {
      continue;
    }

    if (release.tag == 'M8960AAAAANLYA113112') {
      release.version = '4.1.1';
    }

    if (release.tag == 'LA.UM.6.8.2.r1-01700-SDM710.0') {
      release.chipset = 'sdm710';
    }

    if (release.tag == 'LA.UM.8.4.r1-04700-8x98.0-1') {
      release.tag = 'LA.UM.8.4.r1-04700-8x98.0';
    }

    if (release.tag == 'LA.UM.6.2.c26-01400-sdm660.0-1') {
      release.tag = 'LA.UM.6.2.c26-01400-sdm660.0';
    }

    if (release.tag == 'LA.UM.5.5.r1-09000-8x96.0-1') {
      release.tag = 'LA.UM.5.5.r1-09000-8x96.0';
    }

    if (release.tag == 'LA.BR.1.1.3.c1-06700-8x16.0-1') {
      release.tag = 'LA.BR.1.1.3.c1-06700-8x16.0';
    }

    releases.push(release);
  }

  return releases;
}
