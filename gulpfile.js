// Include gulp
var gulp = require('gulp');
 
// Include Our Plugins
var jshint        = require('gulp-jshint');
var concat        = require('gulp-concat');
var concatCss     = require('gulp-concat-css');
var uglify        = require('gulp-uglify');
var rename        = require('gulp-rename');
var mainBowerFiles = require('main-bower-files');
var inject        = require('gulp-inject');

 
// Lint Task
gulp.task('lint', function() {
    return gulp.src('components/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});
 

gulp.task('injectAssets', function () {

    var target = gulp.src('index.html');
    return target.pipe(inject(gulp.src(mainBowerFiles(), {read: false})))
    .pipe(gulp.dest(''));
});


// Concatenate & Minify JS
gulp.task('componentScripts', function() {
    return gulp.src('components/**/*.js')
        .pipe(concat('components/all.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/components'));
});

 
// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('components/**/*.js', ['componentScripts']);
    gulp.watch('components/**/*.css', ['concatCss']);
    //gulp.watch('components/**/*.html', ['templates']);
    //gulp.watch('scss/*.scss', ['sass']);
});
 
 
gulp.task('concatCss', function () {
  return gulp.src('components/**/*.css')
    .pipe(concatCss("all.components.css"))
    .pipe(gulp.dest('dist/components'));
});
 
// Default Task
gulp.task('default', [
    'lint', 
    'injectAssets', 
    'componentScripts', 
    'concatCss', 
    'watch'

]);














