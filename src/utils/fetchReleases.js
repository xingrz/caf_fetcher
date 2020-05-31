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

    releases.push(release);
  }

  return releases;
}
