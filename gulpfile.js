/* eslint-env node */
const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const babel = require("gulp-babel");
const concat = require("gulp-concat");
const iife = require("gulp-iife");
const uglify = require("gulp-uglify");

const fileList = [
	"src/index.js",
	"src/util/ArrayHandlers.js",
	"src/util/EventEmitter.js",
	"src/core/Protocol.js",
	"src/core/Player.js",
	"src/core/PlayerProxy.js",
	"src/core/Client.js",
	"src/websocket/WebSocketProtocol.js",
	"src/export.js"
];

gulp.task("default", ["minified"], function () {
	return gulp.src(fileList)
		.pipe(sourcemaps.init())
		.pipe(concat("syncweb.js"))
		.pipe(babel())
		.pipe(iife({ useStrict: false, prependSemicolon: false }))
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest("dist"));
});

gulp.task("minified", function () {
	return gulp.src(fileList)
		.pipe(sourcemaps.init())
		.pipe(concat("syncweb.min.js"))
		.pipe(babel())
		.pipe(iife({ useStrict: false, prependSemicolon: false }))
		.pipe(uglify())
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest("dist"));
});
