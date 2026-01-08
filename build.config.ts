import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: false, // ESM Only
    inlineDependencies: true, // Bundle all dependencies
  },
});
