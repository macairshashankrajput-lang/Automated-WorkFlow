const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
];

// Polyfill fix for react-native 0.81+ package exports
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName && moduleName.includes("rn-get-polyfills")) {
    return {
      type: "empty",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Ensure react-native-css-interop cache directory exists and is watched by Metro on Vercel
const cssInteropDir = path.resolve(__dirname, "node_modules/react-native-css-interop");
const cssInteropCacheDir = path.resolve(cssInteropDir, ".cache");

if (!fs.existsSync(cssInteropCacheDir)) {
  fs.mkdirSync(cssInteropCacheDir, { recursive: true });
  fs.writeFileSync(path.resolve(cssInteropCacheDir, "web.css"), "/* NativeWind cache */");
}

config.watchFolders = [
  __dirname,
  cssInteropDir,
  cssInteropCacheDir,
];

module.exports = withNativeWind(config, {
  input: "./global.css",
  forceWriteFileSystem: true,
});
