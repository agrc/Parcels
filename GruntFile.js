var osx = 'OS X 10.10';
var windows = 'Windows 8.1';
var browsers = [{
    browserName: 'safari',
    platform: osx
}, {
    browserName: 'firefox',
    platform: windows
}, {
    browserName: 'chrome',
    platform: windows
}, {
    browserName: 'microsoftedge',
    platform: 'Windows 10'
}, {
    browserName: 'internet explorer',
    platform: windows,
    version: '11'
}, {
    browserName: 'internet explorer',
    platform: 'Windows 8',
    version: '10'
}, {
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '9'
}];



module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.loadNpmTasks('intern');

    var otherFiles = [
        'src/app/**/*.html',
        'src/app/**/*.css',
        'src/index.html',
        'src/ChangeLog.html'
    ];
    var jsFiles = [
        'src/app/**/*.js',
        'profiles/*.js',
        'GruntFile.js'
    ];
    var bumpFiles = [
        'package.json',
        'bower.json',
        'src/app/package.json',
        'src/app/config.js'
    ];
    var deployFiles = [
        '**',
        '!**/*.uncompressed.js',
        '!**/*consoleStripped.js',
        '!**/bootstrap/less/**',
        '!**/bootstrap/test-infra/**',
        '!**/tests/**',
        '!build-report.txt',
        '!components-jasmine/**',
        '!favico.js/**',
        '!jasmine-favicon-reporter/**',
        '!jasmine-jsreporter/**',
        '!stubmodule/**',
        '!util/**'
    ];
    var deployDir = 'Parcels';
    var secrets;
    var sauceConfig = {
        urls: ['http://127.0.0.1:8000/_SpecRunner.html'],
        tunnelTimeout: 120,
        build: process.env.TRAVIS_JOB_ID,
        browsers: browsers,
        testname: 'parcels',
        maxRetries: 10,
        maxPollRetries: 10,
        'public': 'public',
        throttled: 5,
        sauceConfig: {
            'max-duration': 1800
        },
        statusCheckAttempts: 500
    };
    try {
        secrets = grunt.file.readJSON('secrets.json');
        sauceConfig.username = secrets.sauce_name;
        sauceConfig.key = secrets.sauce_key;
    } catch (e) {
        // swallow for build server
        secrets = {
            stage: {
                host: '',
                username: '',
                password: ''
            },
            prod: {
                host: '',
                username: '',
                password: ''
            }
        };
    }

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bump: {
            options: {
                files: bumpFiles,
                commitFiles: bumpFiles.concat('src/ChangeLog.html'),
                push: false
            }
        },
        clean: {
            build: ['dist'],
            deploy: ['deploy']
        },
        compress: {
            main: {
                options: {
                    archive: 'deploy/deploy.zip'
                },
                files: [{
                    src: deployFiles,
                    dest: './',
                    cwd: 'dist/',
                    expand: true
                }]
            }
        },
        connect: {
            options: {
                livereload: true,
                base: '.'
            },
            jasmine: {
                options: {
                    port: 8000,
                    base: {
                        path: '.',
                        options: {
                            index: '_SpecRunner.html'
                        }
                    }
                }
            },
            openJasmine: {
                options: {
                    open: true,
                    port: 8000,
                    base: {
                        path: '.',
                        options: {
                            index: '_SpecRunner.html'
                        }
                    }
                }
            }
        },
        copy: {
            main: {
                files: [{expand: true, cwd: 'src/', src: ['*.html'], dest: 'dist/'}]
            }
        },
        dojo: {
            prod: {
                options: {
                    // You can also specify options to be used in all your tasks
                    profiles: ['profiles/prod.build.profile.js', 'profiles/build.profile.js'] // Profile for build
                }
            },
            stage: {
                options: {
                    // You can also specify options to be used in all your tasks
                    profiles: ['profiles/stage.build.profile.js', 'profiles/build.profile.js'] // Profile for build
                }
            },
            options: {
                // You can also specify options to be used in all your tasks
                dojo: 'src/dojo/dojo.js', // Path to dojo.js file in dojo source
                load: 'build', // Optional: Utility to bootstrap (Default: 'build')
                releaseDir: '../dist',
                requires: ['src/app/packages.js', 'src/app/run.js'], // Optional: Module to require for the build (Default: nothing)
                basePath: './src'
            }
        },
        eslint: {
            options: {
                configFile: '.eslintrc'
            },
            main: {
                src: jsFiles
            }
        },
        imagemin: {
            main: {
                options: {
                    optimizationLevel: 3
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    // exclude tests because some images in dojox throw errors
                    src: ['**/*.{png,jpg,gif}', '!**/tests/**/*.*'],
                    dest: 'src/'
                }]
            }
        },
        intern: {
            main: {
                options: {
                    runType: 'client', // defaults to 'client'
                    config: 'src/app/tests/spec/intern',
                    reporters: ['Console'],
                    suites: ['SpecApp']
                }
            }
        },
        jasmine: {
            main: {
                options: {
                    specs: ['src/app/**/Spec*.js'],
                    vendor: [
                        'src/jasmine-favicon-reporter/vendor/favico.js',
                        'src/jasmine-favicon-reporter/jasmine-favicon-reporter.js',
                        'src/jasmine-jsreporter/jasmine-jsreporter.js',
                        'src/app/tests/jasmineTestBootstrap.js',
                        'src/dojo/dojo.js',
                        'src/app/packages.js',
                        'src/app/tests/jsReporterSanitizer.js',
                        'src/app/tests/jasmineAMDErrorChecking.js'
                    ],
                    host: 'http://localhost:8000'
                }
            }
        },
        processhtml: {
            options: {},
            main: {
                files: {
                    'dist/index.html': ['src/index.html'],
                    'dist/user_admin.html': ['src/user_admin.html']
                }
            }
        },
        'saucelabs-jasmine': {
            all: {
                options: sauceConfig
            }
        },
        secrets: secrets,
        sftp: {
            options: {
                path: './wwwroot/' + deployDir + '/',
                srcBasePath: 'deploy/',
                showProgress: true,
                readyTimeout: 3000
            },
            stage: {
                files: {
                    './': 'deploy/deploy.zip'
                },
                options: {
                    host: '<%= secrets.stage.host %>',
                    username: '<%= secrets.stage.username %>',
                    password: '<%= secrets.stage.password %>'
                }
            },
            prod: {
                files: {
                    './': 'deploy/deploy.zip'
                },
                options: {
                    host: '<%= secrets.prod.host %>',
                    username: '<%= secrets.prod.username %>',
                    password: '<%= secrets.prod.password %>'
                }
            }
        },
        sshexec: {
            options: {
                readyTimeout: 3000
            },
            stage: {
                command: ['cd wwwroot/' + deployDir, 'unzip -oq deploy.zip', 'rm deploy.zip'].join(';'),
                options: {
                    host: '<%= secrets.stage.host %>',
                    username: '<%= secrets.stage.username %>',
                    password: '<%= secrets.stage.password %>'
                }
            },
            prod: {
                command: ['cd wwwroot/' + deployDir, 'unzip -oq deploy.zip', 'rm deploy.zip'].join(';'),
                options: {
                    host: '<%= secrets.prod.host %>',
                    username: '<%= secrets.prod.username %>',
                    password: '<%= secrets.prod.password %>'
                }
            }
        },
        stylus: {
            main: {
                options: {
                    compress: false,
                    'resolve url': true
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['app/**/*.styl'],
                    dest: 'src/',
                    ext: '.css'
                }]
            }
        },
        watch: {
            options: {
                livereload: true
            },
            eslint: {
                files: jsFiles,
                tasks: ['newer:eslint:main', 'jasmine:main:build']
            },
            src: {
                files: jsFiles.concat(otherFiles),
                options: {
                    livereload: true
                }
            },
            stylus: {
                files: 'src/app/**/*.styl',
                tasks: ['stylus']
            }
        }
    });

    grunt.registerTask('default', [
        'jasmine:main:build',
        'eslint:main',
        'stylus',
        'connect:jasmine',
        'watch'
    ]);
    grunt.registerTask('launch', [
        'jasmine:main:build',
        'eslint:main',
        'stylus',
        'connect:openJasmine',
        'watch'
    ]);
    grunt.registerTask('build-prod', [
        'eslint:main',
        'clean:build',
        'newer:imagemin:main',
        'stylus',
        'dojo:prod',
        'copy:main',
        'processhtml:main'
    ]);
    grunt.registerTask('deploy-prod', [
        'clean:deploy',
        'compress:main',
        'sftp:prod',
        'sshexec:prod'
    ]);
    grunt.registerTask('build-stage', [
        'eslint:main',
        'clean:build',
        'newer:imagemin:main',
        'stylus',
        'dojo:stage',
        'copy:main',
        'processhtml:main'
    ]);
    grunt.registerTask('deploy-stage', [
        'clean:deploy',
        'compress:main',
        'sftp:stage',
        'sshexec:stage'
    ]);
    grunt.registerTask('sauce', [
        'jasmine:main:build',
        'connect',
        'saucelabs-jasmine'
    ]);
    grunt.registerTask('travis', [
        'eslint:main',
        'sauce',
        'build-prod'
    ]);
};
