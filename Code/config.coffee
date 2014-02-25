exports.config =
  # See docs at http://brunch.readthedocs.org/en/latest/config.html.
  conventions:
    assets:  /^app\/assets\//
    ignored: /^(app\/styles\/overrides|(.*?\/)?[_]\w*)/
  modules:
    definition: false
    wrapper: false
  paths:
    public: '_public'
  files:
    javascripts:
      joinTo:
        'js/app.js': /^app/
        'js/vendor.js': /^(bower_components|vendor)/
      order :
        before: [
          'bower_components/jquery/dist/jquery.js',
          'bower_components/underscore/underscore.js',
          "bower_components/lz-string/libs/lz-string-1.3.3.js",
          "bower_components/sifter/sifter.js",
          "bower_components/microplugin/src/microplugin.js",

          "bower_components/angular/angular.js",
          "bower_components/angular-route/angular-route.js",
          "bower_components/angular-elastic/elastic.js",
          "bower_components/angular-selectize/angular-selectize.js",
          "bower_components/angular-bootstrap/ui-bootstrap-tpls.js",

          'app/scripts/ftss-init.js',
          'app/scripts/ftss-icons.js',
          'app/scripts/ftss-utils.js',
          'app/scripts/ftss-filters.js',
          'app/scripts/ftss-models.js',
          'app/scripts/ftss-directives.js',
          'app/scripts/ftss-main-controller.js',
          'app/scripts/ftss-controllers.js'
        ]

    stylesheets:
      joinTo:
        'css/app.css': /^(app|vendor|bower_components)/
      order:
        before: [
          'app/styles/bootstrap.css'
        ]

    templates:
      joinTo:
        'js/dontUseMe' : /^app/ # dirty hack for Jade compiling.

  plugins:
    jade:
      pretty: false # Adds pretty-indentation whitespaces to output (false by default)
    jade_angular:
      modules_folder: 'partials'
      locals: {}

  # Enable or disable minifying of result js / css files.
  # minify: true
