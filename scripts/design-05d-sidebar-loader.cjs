// Chargeur réservé à la recette : TypeScript et Sass déjà installés.
module.exports = function (source) {
  if (this.resourcePath.endsWith('.css')) return source;
  if (this.resourcePath.endsWith('.scss')) {
    const sass = require('sass');
    return sass.compileString(source, {
      url: require('node:url').pathToFileURL(this.resourcePath),
      loadPaths: [process.cwd() + '/src', process.cwd()],
    }).css;
  }
  return require('typescript').transpileModule(source, {
    compilerOptions: { jsx: 4, module: 99, target: 7, esModuleInterop: true },
    fileName: this.resourcePath,
  }).outputText;
};
