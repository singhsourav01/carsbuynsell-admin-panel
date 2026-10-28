const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Metro starts one worker per CPU thread by default (15 on a 16-thread machine).
// With ~8 GB RAM, those workers plus Gradle run out of memory during the
// release bundle (":app:createBundleReleaseJsAndAssets" exit value 7).
config.maxWorkers = 2;

module.exports = config;
