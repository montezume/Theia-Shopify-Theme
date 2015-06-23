module.exports = function(grunt) {

    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });

    // Private variables
    var private = grunt.file.readJSON('private.json');

    grunt.loadNpmTasks('grunt-shopify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.initConfig({
        shopify: {
            options: {
                api_key: private.shopify.api_key,
                password: private.shopify.password,
                url: "theia2.myshopify.com", 
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
