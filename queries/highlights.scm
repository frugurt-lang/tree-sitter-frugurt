"break" @keyword
"commutative" @keyword
"continue" @keyword
"else" @keyword
"fn" @keyword
"if" @keyword
"let" @keyword
"operator" @keyword
"pub" @keyword
"return" @keyword
"struct" @keyword
"static" @keyword
"while" @keyword
"impl" @keyword


(number_literal) @number
(string_literal) @string
(bool_literal) @bool
(comment) @comment

(let_statement
    ident: (identifier) @function.declaration
    value: [
        (function_expression)
        (curry_call_expression)
    ]
)
