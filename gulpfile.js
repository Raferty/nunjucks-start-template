/* параметры для gulp-autoprefixer */
var autoprefixerList = [
    'last 15 versions',
	'> 1%',
	'ie 8',
	'ie 7'
];

var path = {
    build: {
        html:  'public/',
        js:    'public/js/',
        css:   'public/css/',
        img:   'public/img/',
        fonts: 'public/fonts/'
    },
    src: {
        html:  'distr/*.html',
        js:    'distr/js/*.js',
        style: 'distr/scss/*.scss',
        img:   'distr/img/**/*.{jpg,png,gif,svg}',
        fonts: 'distr/fonts/**/*.*'
    },
    watch: {
        html:  'distr/**/*.{html,php}',
        js:    'distr/js/**/*.js',
        css:   'distr/scss/*.scss',
        img:   'distr/img/*.*',
        fonts: 'distr/fonts/**/*.*'
    },
    clean:     './public'
};

/* настройки сервера */
var config = {
    server: {
        baseDir: './public'
    },
    notify: false
};

/* подключаем плагины */
var gulp            = require('gulp'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    plugins         = gulpLoadPlugins(),
    
    webserver       = require('browser-sync'),
    plumber         = require('gulp-plumber'),
    sourcemaps      = require('gulp-sourcemaps'),
    sass            = require('gulp-sass'),
    autoprefixer    = require('gulp-autoprefixer'),
    uglify          = require('gulp-uglify'),
    cache           = require('gulp-cache'),
    imagemin        = require('gulp-imagemin'),
    jpegrecompress  = require('imagemin-jpeg-recompress'),
    pngquant        = require('imagemin-pngquant'), 
    del             = require('del'),
    cssnano         = require('gulp-cssnano'),
    cssbeautify     = require('gulp-cssbeautify'),
    nunjucks        = require('gulp-nunjucks'),
    rigger          = require('gulp-rigger'),
    ttf2woff        = require('gulp-ttf2woff'),
	ttf2woff2       = require('gulp-ttf2woff2'),
    replace         = require('gulp-url-replace');

// запуск сервера
gulp.task('webserver', function () {
    webserver(config);
});

// сбор html
gulp.task('html:build', function () {
    gulp.src(path.src.html)
        .pipe(plumber())
        .pipe(nunjucks.compile())
        .pipe(gulp.dest(path.build.html))
        .pipe(webserver.reload({stream: true}));
});

// сбор стилей
gulp.task('css:build', function () {
    gulp.src(path.src.style)
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(rigger())
        .pipe(sass({
            outputStyle: 'expanded'
        }))
        .pipe(autoprefixer({
            browsers: autoprefixerList
        }))
        .pipe(cssbeautify({
            indent: '	'
        }))
        .pipe(cssnano({
            safe: true,
            minifyFontValues: { removeQuotes: false }
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(path.build.css))
        .pipe(webserver.reload({stream: true}));
});

// сбор js
gulp.task('js:build', function () {
    gulp.src(path.src.js)
        .pipe(plumber())
        .pipe(rigger())
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(path.build.js))
        .pipe(webserver.reload({stream: true}));
});

// перенос шрифтов
gulp.task('fonts:build', ['fonts:ttf2woff', 'fonts:ttf2woff2'], function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts));
});

gulp.task('fonts:ttf2woff', function(){
	gulp.src(path.src.fonts)
		.pipe(ttf2woff())
		.pipe(gulp.dest(path.build.fonts));
});

gulp.task('fonts:ttf2woff2', function(){
	gulp.src(path.src.fonts)
		.pipe(ttf2woff2())
		.pipe(gulp.dest(path.build.fonts));
});

// обработка картинок
gulp.task('image:build', function () {
    gulp.src(path.src.img)
        .pipe(cache(imagemin([
		    imagemin.gifsicle({interlaced: true}),
            jpegrecompress({
                progressive: true,
                max: 90,
                min: 80
            }),
            pngquant(),
            imagemin.svgo({plugins: [{removeViewBox: false}]})
		])))
    
        .pipe( plugins.rename(function (path) {
            let slash = '/';
            //if ( os.type() == 'Windows_NT' ) slash = '\\';
            path.dirname = path.dirname.replace(slash + 'img', ''); /* Замена пути к картинкам для конечного пути: block/img/*.* -> img/block/*.* */
        }) )
    
        .pipe(gulp.dest(path.build.img));
});

// удаление каталога build 
gulp.task('clean:build', function () {
    del.sync(path.clean);
});

// очистка кэша
gulp.task('cache:clear', function () {
  cache.clearAll();
});

// отдельная задача для переноса и конвертации шрифтов
gulp.task('init:build', [
    'fonts:build'
]);

// сборка
gulp.task('build', [
    'html:build',
    'css:build',
    'js:build',
    'image:build'
]);

// запуск задач при изменении файлов
gulp.task('watch', function() {
    gulp.watch(path.watch.html, ['html:build']);
    gulp.watch(path.watch.css, ['css:build']);
    gulp.watch(path.watch.js, ['js:build']);
    gulp.watch(path.watch.img, ['image:build']);
});

// задача по умолчанию
gulp.task('default', [
    'build',
    'webserver',
    'watch'
]);