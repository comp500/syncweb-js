/* eslint-env node */
const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const babel = require("gulp-babel");
const concat = require("gulp-concat");
const wrap = require("gulp-wrap");

gulp.task("default", function () {
	return gulp.src(["src/index.js", "src/Client.js"])
		.pipe(sourcemaps.init())
		.pipe(concat("syncplay.js"))
		.pipe(babel())
		.pipe(wrap('(function(){\n<%= contents %>\n})();'))
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest("dist"));
});
