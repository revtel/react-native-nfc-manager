const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = {
	watchFolders: [workspaceRoot],
	resolver: {
		unstable_enableSymlinks: true,
		resolveRequest(context, moduleName, platform) {
			// The linked library lives beside this app and has its own dev dependencies.
			// Resolve React and RN from the app so the bundle uses one runtime copy.
			const isAppRuntime = /^(react|react-native)(\/|$)/.test(moduleName);
			return context.resolveRequest(
				isAppRuntime
					? {
						...context,
						originModulePath: path.join(projectRoot, 'package.json'),
						allowHaste: false,
						disableHierarchicalLookup: true,
						nodeModulesPaths: [path.join(projectRoot, 'node_modules')],
						extraNodeModules: {
							react: path.join(projectRoot, 'node_modules/react'),
							'react-native': path.join(projectRoot, 'node_modules/react-native'),
						},
					}
					: context,
				moduleName,
				platform,
			);
		},
		nodeModulesPaths: [
			path.resolve(projectRoot, 'node_modules'),
			path.resolve(workspaceRoot, 'node_modules'),
		],
	},
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
