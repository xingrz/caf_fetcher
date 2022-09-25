import http from 'got';
import * as cheerio from 'cheerio';
import { DateTime } from 'luxon';

const RELEASE_URL = 'https://wiki.codelinaro.org/en/clo/la/release';

export interface IRelease {
  date: Date;
  tag: string;
  chipset: string;
  version: string;
}

export default async function fetchReleases(): Promise<IRelease[]> {
  const releases: IRelease[] = [];
  const html = await http.get(RELEASE_URL).text();
  const $ = cheerio.load(html);

  for (const row of $('template[slot="contents"] table tr')) {
    const cells = $('td', row);
    if (cells.length != 5) {
      continue;
    }

    const date = DateTime.fromFormat($(cells[0]).html()!.trim(), 'DDD');
    if (!date.isValid) {
      continue;
    }

    const version = ((version) => {
      if (!version || version == '00.00.00') {
        return '-';
      } else {
        return version.split('.').map(Number).join('.');
      }
    })($(cells[4]).html());

    const release: IRelease = {
      date: date.toJSDate(),
      tag: $(cells[1]).html()!.trim(),
      chipset: $(cells[2]).html()!.trim(),
      version: version,
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
