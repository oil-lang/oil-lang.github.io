var fs = require("fs");
var path = require("path");
var url = require("url");

var gulp = require('gulp');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var del = require('del');
var browserSync = require('browser-sync');
var watchify = require('watchify');
var browserify = require('browserify');
var hbsfy = require('hbsfy');
var _ = require('lodash');
var brfs = require('brfs');
var through = require('through2');

var reload = browserSync.reload;

var build_options = {
    debug: true,
    entries: ['./ts/main.ts', './ts/node.d.ts']
};

function text_transform (file) {
    if (/\.d\.ts$/.test(file)) return through();
    return brfs(file);
}

var options = _.assign(build_options, watchify.args);
var bundler = watchify(browserify(options));
bundler.transform(hbsfy);
bundler.plugin('tsify', {
    target: 'ES5',
    noImplicitAny: true
});
bundler.transform(text_transform);

bundler.on('update', bundle_task); // on any dep update, runs the bundler
bundler.on('log', gutil.log); // output build logs to terminal

function bundle_task () {

  return bundler.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('dev.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist'));
}

gulp.task('watch', function () {
    browserSync({
        open: false,
        server: {
            baseDir: '.',
            index: 'index-dev.html'
        }
    });

    gulp.watch('scss/*.scss', ['css']);
    gulp.watch('*.html', {cwd: '.'}, reload);

    return bundle_task();
});

gulp.task('build', function () {
    browserify(build_options)
        .transform(hbsfy)
        .plugin('tsify', {
            target: 'ES5'
        })
        .transform(text_transform)
        .bundle()
        .on('error', function(err){
            // print the error (can replace with gulp-util)
            console.log(err.message);
            // end this stream
            this.emit('end');
        })//gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source('index.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest('./dist'));
});

gulp.task('css', function () {
    return gulp.src('./scss/**/*.scss')
        .pipe(sourcemaps.init())
             // Will generate several css file per scss file
             // that does not start with '_'
            .pipe(sass())
            //.pipe(concat('style.css'))
        .pipe(sourcemaps.write())
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('./dist'))
        .pipe(reload({ stream:true }));
});

gulp.task('clean', function (cb) {
    del([
      'dist',
    ], cb);
});
