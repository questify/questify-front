const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Permet d'importer depuis packages/core
config.watchFolders = [workspaceRoot];

// Résout les deps depuis le root (évite les doubles react)
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.extraNodeModules = {
    react: path.resolve(workspaceRoot, "node_modules/react"),
};

module.exports = config;