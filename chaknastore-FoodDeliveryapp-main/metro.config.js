const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);

// Ensure react-native-css-interop cache directory exists and is watched by Metro on Vercel
const cssInteropDir = path.resolve(__dirname, "node_modules/react-native-css-interop");
const cssInteropCacheDir = path.resolve(cssInteropDir, ".cache");

if (!fs.existsSync(cssInteropCacheDir)) {
  fs.mkdirSync(cssInteropCacheDir, { recursive: true });
  fs.writeFileSync(path.resolve(cssInteropCacheDir, "web.css"), "/* NativeWind cache */");
}

config.watchFolders = [
  ...(config.watchFolders || []),
  cssInteropDir,
  cssInteropCacheDir,
];

module.exports = withNativeWind(config, {
  input: "./global.css",
  forceWriteFileSystem: true,
});
