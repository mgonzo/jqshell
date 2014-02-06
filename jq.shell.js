'use strict';
;(function ($) {

// create the plugin
$.extend($.fn, {
  jqshell: function (options, callback) {
    if (this.length) {
      return this.each( function () {
        new Shell(options, this, callback);
      });
    }
  }
});


// the function used in the plugin
var Shell = function (options, element, callback) {

  // Save a copy of the element
  var el = element
  , $el = $(el)

  // Set the defaults
  , defaults = {
        prmpt: window.navigator.userAgent.split(' ')[0] + '&gt;&gt;'
      , theme: 'default'
    }

  // Mixin the user options
  , opt = $.extend({}, defaults, options)

  // to store globally accessible elements
  , my = {}

  /**
  * @name buildHTML 
  * @desc build the elements we need and store them globally
  * @returns
  */
  , buildHTML = function () {
        my.left = document.createElement('section')
      , my.right = document.createElement('section')
      , my.prmpt = document.createElement('ul')
      , my.entries = document.createElement('ul')
      , my.entryField = document.createElement('textarea');

      my.right.id = 'entry';
      my.prmpt.id = 'prmpt';
      my.entries.id = 'entries';
      my.entryField.id = 'entryField';
      my.entryField.spellcheck = false;

      my.left.appendChild(my.prmpt);
      my.right.appendChild(my.entries);
      my.right.appendChild(my.entryField);
      el.appendChild(my.left);
      el.appendChild(my.right);
    }

  /**
  * @name writeln
  * @desc write out and carriage return or empty return
  */
  , writeln = function (input) {
      var prmpt = document.createElement('li')
        , entry = document.createElement('li');

      // Advance the prompt
      $(prmpt).html(opt.prmpt);
      $(my.prmpt).append(prmpt);

      // Advance the entries
      if (input !== undefined) {
        if (input === '') entry.style.height = '20px';
        $(entry).html(input);
        $(my.entries).append(entry);
      }
    }

  // command history
  , history = function () {
                var arr = []
                  , index = 0;
                return {
                          push: function (input) {
                                  arr.push(input);
                                  index = arr.length; // last + 1
                                }
                        , get: function () {
                                 return arr;
                               }
                        , length: function () {
                                    return arr.length;
                                  }
                        , getPrev: function () {
                                     // Save current
                                     var current = index - 1;

                                     // Decrement index, stop at 0
                                     index -= 1;
                                     if (current <= 0) {
                                       index = 0;
                                       current = index;
                                     }

                                     // Return current
                                     return arr[current];
                                   }
                        , getNext: function () {
                                     // Save current
                                     var current = index + 1;

                                     // Increment index, stop at length
                                     index += 1;
                                     if (current >= arr.length - 1) {
                                       index = arr.length - 1;
                                       current = index;
                                     }

                                     // Return current
                                     return arr[current];
                                   }
                       };
              }

  // commands
  , cmd = {
        clear: function () {
                 $(my.prmpt).empty();
                 $(my.entries).empty();
                 writeln();
               }

      , echo: function (input) {
                // input array to string,
                // strip whitespace,
                // write it out
                writeln(input.join(' ').replace(/^[ \t]+/,''));
              }

      , useragent: function () {
                     writeln(window.navigator.userAgent);
                   }

      , date: function () {
                var now = Date.now()
                  , date = new Date(now);

                writeln(date.toDateString());
              }

      , now: function () {
               var now = Date.now()
                 , date = new Date(now);

               writeln(date.toString());
             }

      , theme: function (input) {
                 var name;

                 if (!input[0] || input[0] === 'default') {
                   name = 'default';
                 }
                 else {
                   name = input[0].toString();
                 }

                 $el.removeClass()
                    .addClass('jqshell')
                    .addClass(name);
               }
    }

  /**
  * @name execute 
  * @desc called on keyup, executes commands on carriage return
  *
  */
  , execute = function (element, event) {
      var input = $(element
          ).val()
			  , isCarriageReturn = input.charCodeAt(input.length - 1) === 10
        , isUpArrow = event.keyCode === 38
        , isDownArrow = event.keyCode === 40 
        , command
        , options = [];

			// Is the last character of input a carriage return?
			if (isCarriageReturn) {

        
				// remove the return character
				input = input.substring(0, input.length-1);

        // write the input line
        writeln(input);

        // save the input in history
        my.history.push(input);

        // split the input into an array
        input = input.split(' ');

				// remove the first string and evaluate it as the command
				// and pass the rest of input as parameters to the handler
        command = input.shift();
        
        // look for options
        if (input.length > 1) {
          for (var a = 0; a < input.length; a+=1) {
            input[a].indexOf('-') == 0 ? options.push(input.shift().substr(1)) : null; // should throw error here
          }
        }

        my.callOptionalCommands = function () {
          if (opt.commands) {
            var keys = Object.keys(opt.commands);
            keys.forEach(function (item, index) {
              opt.commands[item].call(this);
            });
          }
        };

        switch (command) {
          case '': writeln('');
                   break;

          case 'clear': cmd.clear();
                        break;

          case 'echo': cmd.echo(input);
                       break;

          case 'ua': cmd.useragent();
                     break;

          case 'date': cmd.date();
                       break;

          case 'now': cmd.now();
                      break;

          case 'theme': cmd.theme(input);
                        break;

          case 'refresh': window.location.reload();
                          break;

          default: my.callOptionalCommands();
                   break;
        }


        // Reset the entry line
        $(element).val('');
      }

      if (isUpArrow) {
        if (my.history.length() > 0) {
          $(my.entryField).val(my.history.getPrev());
        }
      }

      if (isDownArrow) {
        if (my.history.length() > 0) {
          $(my.entryField).val(my.history.getNext());
        }
      }
    }
  
  
  /**
  * @name init
  * @desc setup the dom, options and events
  * @returns the public object
  */
  , init = function () {

      // Add initial theme
      $el.addClass('jqshell default')
         .addClass(opt.theme);

      // Save a history object
      my.history = history();

      // Creating the necessary elements
      buildHTML();

      // Set focus
      $(my.entryField).focus();

      // Set the first line
      writeln();

      // Events
      $(window).on('click', function () {
        $(my.entryField).focus();
      });

      $(my.entryField).on('keyup', function (e) {
        execute(this, e);
      });


    };

  // Accessible functions in the data object
  //$el.data('myfunc', myfunc);

  // add opt commands to the list
  
  // Go
  init();
};

})(jQuery);
