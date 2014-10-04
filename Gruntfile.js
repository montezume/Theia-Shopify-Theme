module.exports = function(grunt) {

    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.loadNpmTasks('grunt-shopify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-concat');

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
                files: ["src/checkout.css", "src/checkout.css.liquid"],
                tasks: ["concat"]
            }
        },
        sass: {
            dist: {
                options: {
                    style: 'compressed'
                },
                files: {
                    'src/checkout.css': 'src/sass/checkout.scss'
                }
            }
        },
        concat: {
            options: {

            },
            dist: {
                src: ['src/checkout.css', 'src/checkout.css.liquid'],
                dest: 'dist/assets/checkout.css.liquid'
            }
        }
        
    });
};
