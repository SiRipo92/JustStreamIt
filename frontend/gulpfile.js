const { src, dest, watch, series } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const browserSync = require("browser-sync").create();
const path = require("path"); // ← add this

const paths = {
  scssEntry: "assets/styles/scss/global.scss",
  scssWatch: "assets/styles/scss/**/*.scss",
  cssOut: "assets/styles/css",
  htmlWatch: "**/*.html",
  jsWatch: "js/**/*.js",
};

function stylesDev() {
  return src(paths.scssEntry)
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: "expanded",
        quietDeps: true,
        includePaths: [path.resolve(__dirname, "node_modules")], // ← absolute
      }).on("error", sass.logError)
    )
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.cssOut))
    .pipe(browserSync.stream({ match: "**/*.css" }));
}

function stylesBuild() {
  return src(paths.scssEntry)
    .pipe(
      sass({
        outputStyle: "compressed",
        quietDeps: true,
        includePaths: [path.resolve(__dirname, "node_modules")], // ← absolute
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
