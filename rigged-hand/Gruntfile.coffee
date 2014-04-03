module.exports = (grunt) ->

  filename = "leap.rigged-hand-<%= pkg.version %>"

  grunt.initConfig
    pkg: grunt.file.readJSON("package.json")
    coffee:
      build:
        files: [{
          expand: true
          cwd: 'src/'
          src: 'leap.rigged-hand.coffee'
          dest: 'build/'
          rename: (task, path, options)->
            task + filename + '.js'
        },
        {
          expand: true
          cwd: 'examples/'
          src: '*.coffee'
          dest: 'examples/'
          rename: (task, path, options)->
            task + path.replace('.coffee', '.js')
        }]
    'string-replace': {
      build: {
        files: {
          './': './*.html'
        }
        options:{
            replacements: [
              {
                pattern: /leap.rigged-hand-*\.js/
                replacement: filename + '.js'
              }
            ]
          }
        }
      }
    clean: {
      build: {
        src: ['./build/*']
      }
    }
    uglify: {
      build: {
        src: "build/#{filename}.js"
        dest: "build/#{filename}.min.js"
      }
    }
    usebanner: {
      build: {
        options: {
          banner:    '/*
                    \n * LeapJS Rigged Hand - v<%= pkg.version %> - <%= grunt.template.today(\"yyyy-mm-dd\") %>
                    \n * http://github.com/leapmotion/leapjs-rigged-hand/
                    \n *
                    \n * Copyright <%= grunt.template.today(\"yyyy\") %> LeapMotion, Inc
                    \n *
                    \n * Licensed under the Apache License, Version 2.0 (the "License");
                    \n * you may not use this file except in compliance with the License.
                    \n * You may obtain a copy of the License at
                    \n *
                    \n *     http://www.apache.org/licenses/LICENSE-2.0
                    \n *
                    \n * Unless required by applicable law or agreed to in writing, software
                    \n * distributed under the License is distributed on an "AS IS" BASIS,
                    \n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                    \n * See the License for the specific language governing permissions and
                    \n * limitations under the License.
                    \n *
                    \n */
                    \n'
        }
        src: ["build/#{filename}.js", "build/#{filename}.min.js"]
      }
    }

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('default', [
    'clean',
    'coffee',
    'string-replace',
    'uglify',
    'usebanner'
  ]);