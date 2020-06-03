const rp = require('request-promise');
const { parseStringPromise } = require('xml2js');

const BLACKLIST = [
  /^(build|bootable|frameworks|external|packages|prebuilts|system|test|tools|developers|compatibility|toolchain)\//,
  /^hardware\/google\//,
  /^hardware\/(akm|interfaces|invensense|libhardware|libhardware_legacy)$/,
  /^(art|bionic|cts|dalvik|development|libcore|libnativehelper|pdk|platform_testing|sdk|shortcut-fe)$/,
  /^vendor\/(google_easel|google_paintbox)$/,
];

module.exports = async function fetchManifest(tag) {
  const content = await rp.get(`https://source.codeaurora.org/quic/la/platform/manifest/plain/${tag}.xml?h=${tag}`);
  const { manifest } = await parseStringPromise(content);
  return manifest.project
    .map(({ $ }) => ({
      name: $.name,
      path: $.path || $.name,
      upstream: ($.upstream ? $.upstream.replace(/^refs\/heads\//, '') : null),
    }))
    .filter(({ path }) => !BLACKLIST.some(path.match.bind(path)))
    .filter(({ path }) => !path.startsWith('device/') || path.startsWith('device/qcom/'));
}
