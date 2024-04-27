// noinspection JSUnusedLocalSymbols,JSUnresolvedReference

module.exports = grammar({
    name: "frugurt",

    extras: $ => [
        /\s/,
        $.comment,
    ],

    word: $ => $.identifier,

    supertypes: $ => [
        $._expression,
        $._statement,
    ],


    rules: {
        source_file: $ => field("body", repeat($._statement)),

        // Misc

        identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

        operator: $ => choice(
            /[-+*\/%<>&|^!?]/,
            /[-+*\/%=<>&|^!?][-+*\/%=<>&|^!?]+/, //I have no idea why {2,} does not work
        ),

        // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
        comment: _ => token(choice(
            seq("//", /.*/),
            seq(
                "/*",
                /[^*]*\*+([^/*][^*]*\*+)*/,
                "/",
            ),
        )),

        // Statements

        _statement: $ => choice(
            $.block_statement,
            $.expression_statement,
            $.let_statement,
            $.set_statement,
            $.set_field_statement,
            $.if_statement,
            $.while_statement,
            $.return_statement,
            $.break_statement,
            $.continue_statement,
            $.operator_statement,
            $.type_statement,
        ),

        block_statement: $ => seq(
            "{",
            field("body", repeat($._statement)),
            "}",
        ),

        expression_statement: $ => prec(9, seq(
            field("value", $._expression),
            ";",
        )),

        let_statement: $ => seq(
            "let",
            field("ident", $.identifier),
            "=",
            field("value", $._expression),
            ";",
        ),

        set_statement: $ => seq(
            field("ident", $.identifier),
            "=",
            field("value", $._expression),
            ";",
        ),

        set_field_statement: $ => prec(11, seq(
            field("what", $.field_access_expression),
            "=",
            field("value", $._expression),
            ";",
        )),

        if_statement: $ => seq(
            "if",
            field("condition", $._expression),
            field("then_body", $.block_statement),
            optional(seq(
                "else",
                field("else_body", choice(
                    $.if_statement,
                    $.block_statement,
                )),
            )),
        ),


        while_statement: $ => seq(
            "while",
            field("condition", $._expression),
            field("body", $.block_statement),
        ),

        return_statement: $ => seq(
            "return",
            optional(field("value", $._expression)),
            ";",
        ),

        break_statement: $ => seq(
            "break",
            ";",
        ),

        continue_statement: $ => seq(
            "continue",
            ";",
        ),

        operator_statement: $ => seq(
            optional(field("commutative", "commutative")),
            "operator",
            field("ident", $.operator),
            "(",
            field("left_ident", $.identifier),
            ":",
            field("left_type_ident", $.identifier),
            ",",
            field("right_ident", $.identifier),
            ":",
            field("right_type_ident", $.identifier),
            ")",
            field("body", choice(
                $.block_statement,
                $.block_expression,
            )),
        ),

        type_statement: $ => seq(
            field("type_type", $.type_type),
            field("ident", $.identifier),
            "{",
            // fields
            repeat(field("fields", $.type_field)),
            repeat(field("sections", $._type_section)),
            "}",
        ),

        type_type: $ => choice("struct", "class", "data"),

        type_field: $ => seq(
            optional(field("pub", "pub")),
            optional(field("static", "static")),
            field("ident", $.identifier),
            optional(seq(
                ":",
                field("type_ident", $.identifier),
            )),
            optional(seq(
                "=",
                field("value", $._expression),
            )),
            ";",
        ),

        _type_section: $ => choice(
            $.type_impl_section,
            $.type_static_section,
            $.type_constraints_section,
        ),

        type_impl_section: $ => seq(
            "-----impl-----",
            repeat(field("methods", $.type_method)),
        ),

        type_static_section: $ => seq(
            "-----static-----",
            repeat(field("methods", $.type_method)),
        ),

        type_constraints_section: $ => seq(
            "-----constraints-----",
            repeat(field("watches", $.type_watch)),
        ),

        type_method: $ => seq(
            field("ident", $.identifier),
            "(",
            sepBy(",", field("args", $.identifier)),
            ")",
            field("body", choice(
                $.block_statement,
                $.block_expression,
            )),
        ),

        type_watch: $ => seq(
            "watch",
            "(",
            sepBy(",", field("args", $.identifier)),
            ")",
            field("body", $.block_statement),
        ),

        // Expressions

        _expression: $ => choice(
            $._literal,
            $.variable,
            $.block_expression,
            $.call_expression,
            $.curry_call_expression,
            $.binaries_expression,
            $.function_expression,
            $.instantiation_expression,
            $.field_access_expression,
            $.if_expression,
        ),

        _nb_expression: $ => prec(3, choice(
            $._literal,
            $.variable,
            $.block_expression,
            $.call_expression,
            $.curry_call_expression,
            $.function_expression,
            $.instantiation_expression,
            $.field_access_expression,
            $.if_expression,
        )),

        _literal: $ => choice(
            $.number_literal,
            $.string_literal,
            $.bool_literal,
            $.nah_literal,
        ),

        number_literal: $ => /[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)/,

        // TODO: maybe add \uxxxx support
        string_literal: $ => /"(?:[^\\\n"]|\\[\\"tnvfr]|\\u\{[0-9a-fA-F]+}|\\\r?\n)*"/,

        bool_literal: $ => choice("true", "false"),

        nah_literal: $ => "nah",

        variable: $ => field("name", $.identifier),

        block_expression: $ => seq(
            "{",
            field("body", repeat($._statement)),
            field("expr", $._expression),
            "}",
        ),

        call_expression: $ => prec(1, seq(
            field("what", $._nb_expression),
            "(",
            sepBy(",", field("args", $._expression)),
            ")",
        )),

        curry_call_expression: $ => prec(1, seq(
            field("what", $._nb_expression),
            "$(",
            sepBy(",", field("args", $._expression)),
            ")",
        )),

        binaries_expression: $ => seq(
            field("content", $._nb_expression),
            repeat1(prec.left(seq(
                field("content", $.operator),
                field("content", $._nb_expression),
            ))),
        ),

        function_expression: $ => seq(
            "fn",
            "(",
            sepBy(",", field("args", $.identifier)),
            ")",
            field("body", choice(
                $.block_statement,
                $.block_expression,
            )),
        ),

        instantiation_expression: $ => prec(1, seq(
            field("what", $._nb_expression),
            ":{",
            sepBy(",", field("args", $._expression)),
            "}",
        )),

        field_access_expression: $ => prec(1, seq(
            field("what", $._nb_expression),
            ".",
            field("field", $.identifier),
        )),

        if_expression: $ => seq(
            "if",
            field("condition", $._expression),
            field("then_body", $.block_expression),
            "else",
            field("else_body", choice(
                $.block_expression,
                $.if_expression,
            )),
        ),
    },
});


function sepBy1(sep, rule) {
    return seq(rule, repeat(seq(sep, rule)));
}


function sepBy(sep, rule) {
    return optional(sepBy1(sep, rule));
}
