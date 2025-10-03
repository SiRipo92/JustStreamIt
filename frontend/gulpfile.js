const { src, dest, watch, series } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const browserSync = require("browser-sync").create();
const path = require("path");
const del = require("del");
const plumber = require("gulp-plumber");

const paths = {
  scssEntry: "assets/styles/scss/global.scss",
  scssRoot:  "assets/styles/scss",
  scssWatch: "assets/styles/scss/**/*.scss",

  cssOut:    "assets/styles/css",

  htmlWatch: "**/*.html",
  jsWatch:   "assets/js/**/*.js",

  // vendor
  vendorSrc: "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js",
  vendorOut: "assets/js/vendor",
};

/**
 * Clean any ACCIDENTAL css/maps in the SCSS tree.
 * (Keeps scss folders pure; run once or before dev/build.)
 */
function cleanScssArtifacts() {
  return del([
    `${paths.scssRoot}/**/*.css`,
    `${paths.scssRoot}/**/*.css.map`,
  ], { force: true });
}

function vendor() {
  return src(paths.vendorSrc).pipe(dest(paths.vendorOut));
}

/**
 * Compile ONLY the single entry (global.scss) in dev mode with sourcemaps.
 * Maps are written alongside the compiled CSS in assets/styles/css.
 */
function stylesDev() {
  return src(paths.scssEntry)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: "expanded",
        quietDeps: true,
        includePaths: [path.resolve(__dirname, "node_modules")],
      }).on("error", sass.logError)
    )
    .pipe(postcss([autoprefixer()]))
    // Write maps into the SAME output dir (cssOut), not into scss directories
    .pipe(sourcemaps.write(".", {
      includeContent: false,
      sourceRoot: "/assets/styles/scss",
    }))
    .pipe(dest(paths.cssOut))
    .pipe(browserSync.stream({ match: "**/*.css" }));
}

/**
 * Production build: minified, no sourcemaps.
 */
function stylesBuild() {
  return src(paths.scssEntry)
    .pipe(plumber())
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

exports.clean = cleanScssArtifacts;
exports.vendor = vendor;
exports.dev = series(cleanScssArtifacts, vendor, stylesDev, serve);
exports.build = series(cleanScssArtifacts, vendor, stylesBuild);
exports.default = exports.dev;
