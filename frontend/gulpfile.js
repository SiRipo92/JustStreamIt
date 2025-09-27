const { src, dest, watch, series } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const browserSync = require("browser-sync").create();
const path = require("path");

const paths = {
  scssEntry: "assets/styles/scss/global.scss",
  scssBase:  "assets/styles/scss",     // ← explicit base
  scssWatch: "assets/styles/scss/**/*.scss",
  cssOut:    "assets/styles/css",
  htmlWatch: "**/*.html",
  jsWatch:   "assets/js/**/*.js",      // ← point to assets/js
};

function stylesDev() {
  return src(paths.scssEntry, { base: paths.scssBase }) // ← ensure base
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: "expanded",
        quietDeps: true,
        includePaths: [path.resolve(__dirname, "node_modules")],
      }).on("error", sass.logError)
    )
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemaps.write("."))       // writes .map next to CSS in cssOut
    .pipe(dest(paths.cssOut))          // → assets/styles/css/global.css
    .pipe(browserSync.stream({ match: "**/*.css" }));
}

function stylesBuild() {
  return src(paths.scssEntry, { base: paths.scssBase })
    .pipe(
      sass({
        outputStyle: "compressed",
        quietDeps: true,
        includePaths: [path.resolve(__dirname, "node_modules")],
      }).on("error", sass.logError)
    )
    .pipe(postcss([autoprefixer()]))
    .pipe(dest(paths.cssOut));
}

function serve() {
  browserSync.init({
    server: { baseDir: "./" },
    port: 5500,
    open: false,
  });
  watch(paths.scssWatch, stylesDev);
  watch([paths.htmlWatch, paths.jsWatch]).on("change", browserSync.reload);
}

exports.dev = series(stylesDev, serve);
exports.build = stylesBuild;
exports.default = exports.dev;
