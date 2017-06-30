'use strict';

// Include gulp and tools we'll use
var gulp = require('gulp');
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var reload = browserSync.reload;
var notifier = require('node-notifier');
var nunjucksRender = require('gulp-nunjucks-render');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'gulp.*', 'autoprefixer', 'main-bower-files'],
  lazy: true
});

// Configuration used within this gulpfile
var dist = './dist/';
var src = './src/';
var config = {
    css: './src/css/**/*.css',
    js: './src/js/**/*.js',
    sass: './src/sass/**/*.scss',
    images: './src/img/**/*',
    fonts: './src/fonts/**/*',
    html: './src/**/*.html',
};

// Autoprefixers
var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

function getRelativePath(absPath) {
    absPath = absPath.replace(/\\/g, '/');
    var curDir = __dirname.replace(/\\/g, '/');
    return absPath.replace(curDir, '');
}

// Beutifying erros on console
function logUglifyError(error) {
    this.emit('end');
    var file = getRelativePath(error.fileName);
    $.util.log($.util.colors.bgRed('Uglify Error:'))
    $.util.log($.util.colors.bgMagenta('file: ') + $.util.colors.inverse(file));
    $.util.log($.util.colors.bgMagenta('line: '+error.lineNumber));
    //remove path from error message
    var message = error.message.substr(error.message.indexOf(' ')+1);
    $.util.log($.util.colors.bgRed(message));
    notifier.notify({ title: 'Gulp message', message: 'Uglify error!' });
}

// Bower js tasks
gulp.task('bower-js', function() {
    return gulp.src($.mainBowerFiles('**/*.js'))
        .pipe($.concat('vendor.min.js'))
        .pipe($.uglify())
        .pipe(gulp.dest(dist + '/js/'));
});

// Bower css tasks
gulp.task('bower-css', function() {
    return gulp.src($.mainBowerFiles('**/*.css'))
        .pipe($.concat('vendor.min.css'))
        .pipe(gulp.dest(dist + '/css/'));
});

// Compile all scss to css
gulp.task('styles', function() {
  return gulp
  .src(config.sass)
  .pipe($.sourcemaps.init())
  .pipe($.plumber())
  .pipe($.sass({outputStyle: 'compressed'}))
  .pipe($.rename({suffix: '.min'}))
  .on('error', $.sass.logError)
  .pipe($.postcss([$.autoprefixer({ browsers: ['last 3 version', '> 5%', 'ie > 8', 'ios > 5'] })]))
  .pipe($.sourcemaps.write('./'))
  .pipe(gulp.dest(dist + '/css/'))
  .pipe(browserSync.stream({match: '**/*.css' }));
});

// html tasks
gulp.task('html', function() {
  return gulp.src(['./src/pages/**/*.html'])
    .pipe(nunjucksRender({
      path: ['./src/partial/']
    }).on('error', logUglifyError))
    .pipe(gulp.dest(dist))
});


// Optimize images
gulp.task('images', function() {
    return gulp.src(config.images)
        .pipe($.cache($.imagemin({progressive: true, interlaced: true})))
        .pipe(gulp.dest(dist + '/img'))
        .pipe($.size({title: 'images'}));
});

// Concat and minify scripts
gulp.task('scripts', function() {
    return gulp.src(config.js)
        .pipe($.sourcemaps.init())
        .pipe($.concat('scripts.js'))
        .pipe($.uglify()).on('error', logUglifyError)
        .pipe($.rename({suffix: '.min'}))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest(dist + '/js'))
        .pipe($.size({title: 'scripts'}));
});

// Fonts
gulp.task('fonts', function() {
    return gulp.src([config.fonts])
        .pipe(gulp.dest('dist/fonts/'));
});


// Clear the cache
gulp.task('clear-cache', function() {
    $.cache.clearAll();
});


// Delete all generated files
gulp.task('clean', del.bind(null, [
    dist + '/css',
    dist + '/img',
    dist + '/**/*.html',
]));

// Optimize files and save the output to the dist folder
gulp.task('dist', ['clean'], function(cb) {
    runSequence('styles', ['images', 'fonts', 'html', 'bower-js', 'bower-css', 'scripts'], cb);
});


// Optimize files, watch for changes & reload, the default task
gulp.task('default', ['dist'], function() {
    browserSync({
        notify: true,
        server: {
            baseDir: dist,
            index: "index.html"
        }
    });
    gulp.watch([config.html], ['html', reload]);
    gulp.watch([config.sass], ['styles', reload]);
    gulp.watch([config.images], ['images', reload]);
});