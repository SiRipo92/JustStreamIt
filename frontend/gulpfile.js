const { src, dest, watch, series, parallel } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const browserSync = require("browser-sync").create();
const path = require("path");

const paths = {
  scssEntry: "assets/styles/scss/global.scss",
  scssBase:  "assets/styles/scss",
  scssWatch: "assets/styles/scss/**/*.scss",
  cssOut:    "assets/styles/css",
  htmlWatch: "**/*.html",
  jsWatch:   "assets/js/**/*.js",

  // vendor
  vendorSrc: "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js",
  vendorOut: "assets/js/vendor",
};

function vendor() {
  return src(paths.vendorSrc).pipe(dest(paths.vendorOut));
}

function stylesDev() {
  return src(paths.scssEntry, { base: paths.scssBase })
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: "expanded",
        quietDeps: true,
        includePaths: [path.resolve(__dirname, "node_modules")],
      }).on("error", sass.logError)
    )
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.cssOut))
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

exports.vendor = vendor;
exports.dev = series(vendor, stylesDev, serve);
exports.build = series(vendor, stylesBuild);
exports.default = exports.dev;
