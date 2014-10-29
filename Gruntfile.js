module.exports = function(grunt) {

    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.loadNpmTasks('grunt-shopify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.initConfig({
        shopify: {
            options: {
                api_key: "ff34c2c6098db58552ac8caf712aa73b",
                password: "a5b420c9fefd67719847beee5f82caa4",
                url: "theia.myshopify.com",
                base: "dist/"
            }
        },
        watch: {
            shopify: {
                files: ["dist/**"],
                tasks: ["shopify"]
            },
            sass: {
                files: ["src/sass/**"],
                tasks: ["sass:dist"]
            },
            concat: {
                files: ["src/checkout-master.css", "src/checkout-master.css.liquid"],
                tasks: ["concat"]
            },
            copy: {
                files: ["src/checkout-master-concat.css.liquid"],
                tasks: ["copy"]
            }
        },
        sass: {
            dist: {
                options: {
                    style: 'compressed'
                },
                files: {
                    'src/checkout-master.css': 'src/sass/checkout-master.scss'
                }
            }
        },
        concat: {
            options: {

            },
            checkout: {
                src: ['src/checkout-master.css', 'src/checkout-master.css.liquid'],
                dest: 'src/checkout-master-concat.css.liquid'
            }
        },
        copy: {
            desktop: {
                src: 'src/checkout-master-concat.css.liquid',
                dest: 'dist/assets/checkout.css.liquid'
            },
            mobile: {
                src: 'src/checkout-master-concat.css.liquid',
                dest: 'dist/assets/checkout.mobile.css.liquid'
            }
        }
    });
};
