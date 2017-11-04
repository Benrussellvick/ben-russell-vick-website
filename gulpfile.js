/// <binding BeforeBuild='build' />

require('es6-promise').polyfill();
var gulp = require("gulp");
var msbuild = require("gulp-msbuild");
var debug = require("gulp-debug");
var foreach = require("gulp-foreach");
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var del = require('del');
var runSequence = require('run-sequence');
var urlAdjuster = require('gulp-css-url-adjuster');
var rename = require('gulp-rename');
var autoprefixer = require('gulp-autoprefixer');
var watch = require('gulp-watch');

// Scripts to bundle
var coreScripts = [
  'html/js/vendor/jquery.fullpage.extensions.min.js',
  'html/js/vendor/fullpage.offsetSections.limited.min.js',
  'html/js/vendor/slick.min.js',
  'html/js/scripts.js'
];

// Development Tasks 
// -----------------
gulp.task('scripts', function () {
    return gulp.src(coreScripts)
        .pipe(concat('global.js'))
        .pipe(gulp.dest('html/js'))
        .pipe(rename('global.min.js'))
        .pipe(gulp.dest('html/js'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Start browserSync server
gulp.task('browserSync', function () {
    browserSync({
        server: {
            baseDir: 'html/'
        }
    })
})

// SASS compile
gulp.task('sass', function () {
    return gulp.src('html/scss/**/*.scss')
      .pipe(sourcemaps.init())
      .pipe(sass().on('error', function (err) {
          console.error(err.message);
          browserSync.notify(err.message, 4000); // Display error in the browser
          this.emit('end'); // Prevent gulp from catching the error and exiting the watch process
      }))
      .pipe(autoprefixer({
          browsers: ['> 1%', 'IE 10'],
          cascade: false
      }))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('html/css'))
      .pipe(browserSync.reload({
          stream: true
      }))
});


// Watchers
gulp.task('watch', ['browserSync', 'sass', 'scripts'], function () {
    gulp.watch('html/scss/**/*.scss', ['sass']);
    gulp.watch(['html/js/**/*.js', '!html/js/global.js', '!html/js/global.min.js'], ['scripts']);
    gulp.watch('html/*.html', browserSync.reload);
    gulp.watch('html/js/**/*.js', browserSync.reload);
});




// Minify CSS
gulp.task('minifyCss', function () {
    return gulp.src('html/css/*.css')
        .pipe(urlAdjuster({
            prepend: '/dist',
            append: '?v=1',
        }))
        .pipe(sourcemaps.init())
        .pipe(cssnano())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/css'));
});


// Build scripts
gulp.task('buildScripts', function () {
    return gulp.src(coreScripts)
        .pipe(concat('global.js'))
        .pipe(gulp.dest('html/js'))
        .pipe(rename('global.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'))
});


// Building and Optimizing CSS
gulp.task('useref', function () {
    return gulp.src('html/*.html')
      .pipe(useref())
      .pipe(gulpIf('*.css',
              urlAdjuster({
                  append: '?v=0.1',
              })
        ))
      .pipe(gulp.dest('dist'))
});


// Cleaning CSS and JS folders
gulp.task('clean:dist', function () {
    return del.sync('dist/css');
    return del.sync('dist/js');
})


// Copy image assets
gulp.task('imagesCopy', function () {
    gulp.src(['html/images/**/*']).pipe(gulp.dest('dist/images'));
});
// Copy Font assets
gulp.task('fontCopy', function () {
    gulp.src(['html/fonts/**/*']).pipe(gulp.dest('dist/fonts'));
});


// Test dist assets using browserSync
gulp.task('distTest', function () {
    browserSync({
        server: {
            baseDir: 'dist/'
        }
    })
});


// Task bundles
// ---------------

// Default gulp
gulp.task('default', function (callback) {
    runSequence(['sass', 'scripts', 'browserSync', 'watch'],
      callback
    )
})

// Build
gulp.task('build', function (callback) {
    runSequence(
      'clean:dist',
      ['sass', 'minifyCss', 'buildScripts', 'imagesCopy', 'fontCopy'],
      callback
    )
})