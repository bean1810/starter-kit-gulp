const {src, dest, lastRun, watch, task, series, parallel} = require('gulp');
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const gulpSass = require('gulp-sass');
const nodeSass = require('node-sass');
const sass = gulpSass(nodeSass);
const less = require('gulp-less');
const stylus = require('gulp-stylus');
const autoPrefixer = require('gulp-autoprefixer');
const minifyCss = require('gulp-clean-css');
const babel = require('gulp-babel');
const webpack = require('webpack-stream');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const imageMin = require('gulp-imagemin');
const browserSync = require('browser-sync').create();
const pug = require('gulp-pug');
const dependents = require('gulp-dependents');

const src_folder = './src/';
const src_assets_folder = src_folder + 'assets/';
const dist_folder = './dist/';
const dist_assets_folder = dist_folder + 'assets/';
const node_modules_folder = './node_modules/';
const dist_node_modules_folder = dist_folder + 'node_modules/';
const node_dependencies = Object.keys(require('./package.json').dependencies || {});

function gulpClear() {
    return del([dist_folder]);
}

// TODO: modify the src path to be suitable for the real project
function gulpHtml() {
    return src([src_folder + '**/*.html'], {
        base: src_folder,
        since: lastRun(gulpHtml)
    })
        .pipe(dest(dist_folder))
        .pipe(browserSync.stream());
}

// TODO: modify the src path to be suitable for the real project
function gulpPug() {
    return src([src_folder + 'pug/**/!(_)*.pug'], {
        base: src_folder + 'pug',
        since: lastRun(gulpPug)
    })
        .pipe(plumber())
        .pipe(pug())
        .pipe(dest(dist_folder))
        .pipe(browserSync.stream());
}

// TODO: modify the src path to be suitable for the real project
function _gulpSass() {
    return src([
        src_assets_folder + 'sass/**/*.sass',
        src_assets_folder + 'scss/**/*.scss'
    ], { since: lastRun(gulpSass) })
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(dependents())
        .pipe(sass())
        .pipe(autoPrefixer())
        .pipe(minifyCss())
        .pipe(sourcemaps.write('.'))
        .pipe(dest(dist_assets_folder + 'css'))
        .pipe(browserSync.stream());
}

// TODO: modify the src path to be suitable for the real project
function gulpLess() {
    return src([ src_assets_folder + 'less/**/!(_)*.less'], { since: lastRun(gulpLess) })
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(less())
        .pipe(autoPrefixer())
        .pipe(minifyCss())
        .pipe(sourcemaps.write('.'))
        .pipe(dest(dist_assets_folder + 'css'))
        .pipe(browserSync.stream());
}

// TODO: modify the src path to be suitable for the real project
function gulpStylus() {
    return src([ src_assets_folder + 'stylus/**/!(_)*.styl'], { since: lastRun(gulpStylus) })
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(stylus())
        .pipe(autoPrefixer())
        .pipe(minifyCss())
        .pipe(sourcemaps.write('.'))
        .pipe(dest(dist_assets_folder + 'css'))
        .pipe(browserSync.stream());
}

// TODO: modify the src path to be suitable for the real project
function gulpJs() {
    return src([ src_assets_folder + 'js/**/*.js' ], { since: lastRun(gulpJs) })
        .pipe(plumber())
        .pipe(webpack({
            mode: 'production'
        }))
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: [ '@babel/env' ]
        }))
        .pipe(concat('all.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(dest(dist_assets_folder + 'js'))
        .pipe(browserSync.stream());
}

// TODO: modify the src path to be suitable for the real project
function gulpImage() {
    return src([ src_assets_folder + 'images/**/*.+(png|jpg|jpeg|gif|svg|ico)' ], { since: lastRun(gulpImage) })
        .pipe(plumber())
        .pipe(imageMin())
        .pipe(dest(dist_assets_folder + 'images'))
        .pipe(browserSync.stream());
}

// TODO: modify the src path to be suitable for the real project
function gulpVendor() {
    if (node_dependencies.length === 0) {
        return new Promise((resolve) => {
            console.log("No dependencies specified");
            resolve();
        });
    }

    return src(node_dependencies.map(dependency => node_modules_folder + dependency + '/**/*.*'), {
        base: node_modules_folder,
        since: lastRun(gulpVendor)
    })
        .pipe(dest(dist_node_modules_folder))
        .pipe(browserSync.stream());
}

function serve() {
    return browserSync.init({
        server: {
            baseDir: [ 'dist' ]
        },
        port: 8080,
        open: false
    });
}

// TODO: modify the src path to be suitable for the real project
function _watch() {
    const watchImages = [
        src_assets_folder + 'images/**/*.+(png|jpg|jpeg|gif|svg|ico)'
    ];

    const watchVendor = [];

    node_dependencies.forEach(dependency => {
        watchVendor.push(node_modules_folder + dependency + '/**/*.*');
    });

    const watchList = [
        src_folder + '**/*.html',
        src_folder + 'pug/**/*.pug',
        src_assets_folder + 'sass/**/*.sass',
        src_assets_folder + 'scss/**/*.scss',
        src_assets_folder + 'less/**/*.less',
        src_assets_folder + 'stylus/**/*.styl',
        src_assets_folder + 'js/**/*.js'
    ];

    watch(watchList, series(dev)).on('change', browserSync.reload);
    watch(watchImages, series(gulpImage)).on('change', browserSync.reload);
    watch(watchVendor, series(gulpVendor)).on('change', browserSync.reload);
}

const build = series(gulpClear, gulpHtml, gulpPug, _gulpSass, gulpLess, gulpStylus, gulpJs, gulpImage, gulpVendor);
const dev = series(gulpHtml, gulpPug, _gulpSass, gulpLess, gulpStylus, gulpJs);
const _default = series(dev, parallel(serve, _watch));

exports.default = _default;
exports.dev =dev;
exports.build = build;

