[
  "break"
  "class"
  "commutative"
  "continue"
  "data"
  "else"
  "fn"
  "if"
  "impl"
  "import"
  "let"
  "operator"
  "pub"
  "return"
  "scope"
  "struct"
  "static"
  "while"
] @keyword

(number_literal) @number
(string_literal) @string
(bool_literal)   @bool
(nah_literal)    @nah
(comment)        @comment

(let_statement
    ident: (identifier) @function.declaration
    value: [
        (function_expression)
        (curry_call_expression)
    ]
)
