/* eslint-env node */
const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const babel = require("gulp-babel");
const concat = require("gulp-concat");
const iife = require("gulp-iife");

gulp.task("default", function () {
	return gulp.src(["src/index.js", "src/Client.js", "src/export.js"])
		.pipe(sourcemaps.init())
		.pipe(concat("syncplay.js"))
		.pipe(babel())
		.pipe(iife({ useStrict: false, prependSemicolon: false }))
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest("dist"));
});
