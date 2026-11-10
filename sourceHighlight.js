/* Colours for the source viewer: JavaScript (and JSON, which is its subset)
   and PHP cut into tokens the way an editor shows them — comments, strings,
   regular expressions, numbers, keywords, literals, and names told apart by
   their place: a function where a call follows, a class where the name starts
   with a capital, a property after a dot (-> and :: in PHP), a variable
   otherwise. In a PHP file only what stands between <?php or <?= and ?> is
   PHP; the page around it stays plain.

   It is a lexer, not a parser: it does not know scopes, and a template string
   or a double-quoted PHP string is one string, what it interpolates included.
   What it guarantees is that the tokens put together are the text it was
   given, to the character.

   Free of DOM: sourceTokens(text, name) returns [[type, text], ...], type
   null for what has no colour; the shell turns them into spans. */

(function(root) {
  var KEYWORDS = {};
  ('async await break case catch class const continue debugger default delete do else export extends finally for from '+
   'function get if import in instanceof let new of return set static switch throw try typeof var void while with yield')
    .split(' ').forEach(function(word) { KEYWORDS[word] = true; });
  var LITERALS = {'true': true, 'false': true, 'null': true, 'undefined': true, 'NaN': true, 'Infinity': true, 'this': true, 'super': true};
  // a word that is a keyword only in some places is a name where a name is meant
  var SOFT = {'async': true, 'from': true, 'get': true, 'of': true, 'set': true, 'static': true};

  var COMMENT = /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y;
  var STRING = /'(?:\\[\s\S]|[^'\\\n])*'?|"(?:\\[\s\S]|[^"\\\n])*"?|`(?:\\[\s\S]|[^`\\])*`?/y;
  var NUMBER = /(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d+)?)n?/y;
  var NAME = /[A-Za-z_$][\w$]*/y;
  var SPACE = /\s+/y;
  var REGEX = /\/(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^\/\\\n\[])+\/[a-z]*/y;

  function match(pattern, text, at) {
    pattern.lastIndex = at;
    var found = pattern.exec(text);
    return found ? found[0] : null;
  }

  /** the first character at or after `at` that is not white space */
  function nextChar(text, at) {
    SPACE.lastIndex = at;
    var space = SPACE.exec(text);
    return text.charAt(space ? at+space[0].length : at);
  }

  function javascriptTokens(text) {
    var tokens = [];
    var at = 0;
    var plain = '';
    // what the last token that was not space or a comment allows next: after
    // a value a slash divides, anywhere else it opens a regular expression
    var afterValue = false;
    var lastChar = '';
    var lastWord = '';   // the name just before, with nothing but space between

    function push(type, piece) {
      if (type === null) {
        plain += piece;
        return;
      }
      if (plain !== '') {
        tokens.push([null, plain]);
        plain = '';
      }
      tokens.push([type, piece]);
    }

    while (at < text.length) {
      var ch = text.charAt(at);
      var piece;

      if ((piece = match(SPACE, text, at)) !== null) {
        push(null, piece);
        at += piece.length;
        continue;
      }
      if (ch == '/' && (piece = match(COMMENT, text, at)) !== null) {
        push('comment', piece);
        at += piece.length;
        continue;
      }
      if ((ch == '\'' || ch == '"' || ch == '`') && (piece = match(STRING, text, at)) !== null) {
        push('string', piece);
        at += piece.length;
        afterValue = true;
        lastChar = ch;
        continue;
      }
      if (ch == '/' && !afterValue && (piece = match(REGEX, text, at)) !== null) {
        push('regex', piece);
        at += piece.length;
        afterValue = true;
        lastChar = '/';
        continue;
      }
      if ((ch >= '0' && ch <= '9' || ch == '.') && (piece = match(NUMBER, text, at)) !== null && piece != '.') {
        push('number', piece);
        at += piece.length;
        afterValue = true;
        lastChar = '0';
        continue;
      }
      if ((piece = match(NAME, text, at)) !== null) {
        var following = nextChar(text, at+piece.length);
        var type;
        if (lastChar == '.') {
          type = following == '(' ? 'function' : 'property';
        } else if (LITERALS[piece] === true) {
          type = 'literal';
        } else if (KEYWORDS[piece] === true && !(SOFT[piece] === true && /[=(:,;.)]/.test(following))) {
          type = 'keyword';
        } else if (lastWord == 'new' || lastWord == 'class' || lastWord == 'extends') {
          type = 'class';
        } else if (following == '(') {
          type = 'function';
        } else if (piece.charAt(0) >= 'A' && piece.charAt(0) <= 'Z' && /[a-z]/.test(piece)) {
          type = 'class';
        } else {
          type = 'variable';
        }
        push(type, piece);
        at += piece.length;
        // after "return", "typeof" and the like a slash opens a regular expression
        afterValue = type != 'keyword';
        lastChar = 'a';
        lastWord = piece;
        continue;
      }
      push(null, ch);
      at++;
      afterValue = ch == ')' || ch == ']' || ch == '}';
      lastChar = ch;
      lastWord = '';
    }
    if (plain !== '') {
      tokens.push([null, plain]);
    }
    return tokens;
  }

  // ---- PHP

  var PHP_KEYWORDS = {};
  ('abstract and array as break callable case catch class clone const continue declare default do echo else elseif empty '+
   'enddeclare endfor endforeach endif endswitch endwhile enum exit extends final finally fn for foreach function global '+
   'goto if implements include include_once instanceof insteadof interface isset list match namespace new or print '+
   'private protected public readonly require require_once return static switch throw trait try unset use var while xor yield')
    .split(' ').forEach(function(word) { PHP_KEYWORDS[word] = true; });
  var PHP_LITERALS = {'true': true, 'false': true, 'null': true, 'self': true, 'parent': true};

  var PHP_OPEN = /<\?(?:php\b|=)/g;
  var PHP_COMMENT = /(?:\/\/|#(?!\[))(?:[^\n?]|\?(?!>))*|\/\*[\s\S]*?(?:\*\/|$)/y;
  var PHP_STRING = /'(?:\\[\s\S]|[^'\\])*'?|"(?:\\[\s\S]|[^"\\])*"?/y;
  var PHP_VARIABLE = /\$[A-Za-z_][\w]*/y;
  var PHP_NAME = /[A-Za-z_][\w]*/y;

  function phpTokens(text) {
    var tokens = [];
    var at = 0;
    var plain = '';
    var inside = false;   // between an opening tag and ?>
    var lastTwo = '';     // the two characters before, space skipped: "->" and "::" make a member
    var lastWord = '';

    function push(type, piece) {
      if (type === null) {
        plain += piece;
        return;
      }
      if (plain !== '') {
        tokens.push([null, plain]);
        plain = '';
      }
      tokens.push([type, piece]);
    }

    while (at < text.length) {
      var piece;
      if (!inside) {
        PHP_OPEN.lastIndex = at;
        var open = PHP_OPEN.exec(text);
        if (!open) {
          push(null, text.substring(at));
          break;
        }
        push(null, text.substring(at, open.index));
        push('keyword', open[0]);
        at = open.index+open[0].length;
        inside = true;
        lastTwo = '';
        lastWord = '';
        continue;
      }
      var ch = text.charAt(at);
      if ((piece = match(SPACE, text, at)) !== null) {
        push(null, piece);
        at += piece.length;
        continue;
      }
      if (ch == '?' && text.charAt(at+1) == '>') {
        push('keyword', '?>');
        at += 2;
        inside = false;
        continue;
      }
      if ((ch == '/' || ch == '#') && (piece = match(PHP_COMMENT, text, at)) !== null) {
        push('comment', piece);
        at += piece.length;
        continue;
      }
      if ((ch == '\'' || ch == '"') && (piece = match(PHP_STRING, text, at)) !== null) {
        push('string', piece);
        at += piece.length;
        lastTwo = '';
        lastWord = '';
        continue;
      }
      if (ch == '$' && (piece = match(PHP_VARIABLE, text, at)) !== null) {
        push('variable', piece);
        at += piece.length;
        lastTwo = '';
        lastWord = '';
        continue;
      }
      if ((ch >= '0' && ch <= '9' || ch == '.') && (piece = match(NUMBER, text, at)) !== null && piece != '.') {
        push('number', piece);
        at += piece.length;
        lastTwo = '';
        lastWord = '';
        continue;
      }
      if ((piece = match(PHP_NAME, text, at)) !== null) {
        var following = nextChar(text, at+piece.length);
        var word = piece.toLowerCase();
        var type;
        if (lastTwo == '->' || lastTwo == '::') {
          type = following == '(' ? 'function' : 'property';
        } else if (PHP_LITERALS[word] === true) {
          type = 'literal';
        } else if (PHP_KEYWORDS[word] === true) {
          type = 'keyword';
        } else if (lastWord == 'new' || lastWord == 'class' || lastWord == 'extends' || lastWord == 'implements' || lastWord == 'instanceof') {
          type = 'class';
        } else if (following == '(') {
          type = 'function';
        } else if (piece.charAt(0) >= 'A' && piece.charAt(0) <= 'Z' && /[a-z]/.test(piece)) {
          type = 'class';
        } else {
          type = 'literal';   // a bare name is a constant: PATHINFO_EXTENSION, __DIR__
        }
        push(type, piece);
        at += piece.length;
        lastTwo = '';
        lastWord = word;
        continue;
      }
      push(null, ch);
      at++;
      lastTwo = (lastTwo+ch).slice(-2);
      lastWord = '';
    }
    if (plain !== '') {
      tokens.push([null, plain]);
    }
    return tokens;
  }

  // ---- by the name of the file

  /** whether the viewer colours a file of this name */
  function sourceHighlights(name) {
    return /\.(?:js|mjs|cjs|json|php)$/i.test(name);
  }

  function sourceTokens(text, name) {
    return /\.php$/i.test(name || '') ? phpTokens(text) : javascriptTokens(text);
  }

  root.sourceTokens = sourceTokens;
  root.sourceHighlights = sourceHighlights;
})(typeof window !== 'undefined' ? window : globalThis);
