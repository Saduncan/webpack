import * as Config from 'webpack-chain';
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

export interface IOptimizationOpts {
  minimize?: boolean;
  devSourceMap?: Config.DevTool;
  prodSourceMap?: Config.DevTool;
}

export const configureOptimizations = (config: Config, opts: IOptimizationOpts) => {
  const { minimize = true, devSourceMap = 'cheap-module-eval-source-map', prodSourceMap = 'source-map' } = opts;

  config.when(
    config.get('mode') === 'development',
    c => {
      config.devtool(devSourceMap);
      config.optimization
        .removeAvailableModules(false)
        .removeEmptyChunks(false)
        // @ts-ignore
        .splitChunks(false)
        .end()
        .output.pathinfo(true)
        .end();
    },
    c => {
      c.devtool(prodSourceMap);
      c.plugin('hash').use(webpack.HashedModuleIdsPlugin);
      c.optimization.runtimeChunk('single');
      c.optimization.splitChunks({
        chunks: 'all',
        name: false,
      });
      c.optimization.minimize(minimize);

      // @ts-ignore
      c.optimization.minimizer('javascript').use(TerserPlugin, [
        {
          exclude: [/\.min\./g],
          // Use multi-process parallel running to improve the build speed
          // Default number of concurrent runs: os.cpus().length - 1
          parallel: true,
          // Enable file caching
          cache: true,
          sourceMap: true,
          terserOptions: {
            parse: {
              // we want terser to parse ecma 8 code. However, we don't want it
              // to apply any minfication steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress' and 'output'
              // sections only apply transformations that are ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              // Disabled because of an issue with Uglify breaking seemingly valid code:
              // https://github.com/facebook/create-react-app/issues/2376
              // Pending further investigation:
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
              // Disabled because of an issue with Terser breaking valid code:
              // https://github.com/facebook/create-react-app/issues/5250
              // Pending futher investigation:
              // https://github.com/terser-js/terser/issues/120
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              // Turned on because emoji and regex is not minified properly using default
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true,
            },
          },
        },
      ]);
    }
  );
};