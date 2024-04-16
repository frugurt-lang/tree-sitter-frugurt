// noinspection JSUnusedLocalSymbols,JSUnresolvedReference

module.exports = grammar({
    name: "frugurt",

    // extras: $ => [
    //     /\s/,
    //     $.comment,
    // ],

    rules: {
        source_file: $ => repeat($._statement),

        // Misc

        identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

        operator: $ => choice(
            /[-+*\/%<>&|^!?]/,
            /[-+*\/%=<>&|^!?][-+*\/%=<>&|^!?]+/, //I have no idea why {2,} does not work
        ),

        comment: $ => prec(100, choice(
            $.line_comment,
            $.block_comment,
        )),

        line_comment: $ => seq(
            "//",
            token.immediate(prec(1, /.*/)),
        ),

        block_comment: $ => seq(
            "/*",
            /.*?/,
            "*/",
        ),

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
            $.operator_definition_statement,
        ),

        block_statement: $ => seq(
            "{",
            field("body", repeat($._statement)),
            "}",
        ),

        expression_statement: $ => seq(
            field("value", $._expression),
            ";",
        ),

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

        set_field_statement: $ => seq(
            field("target", $._expression),
            ".",
            field("field", $.identifier),
            "=",
            field("value", $._expression),
            ";",
        ),

        if_statement: $ => seq(
            "if",
            field("condition", $._expression),
            field("then_body", $.block_statement),
            optional(field("else_body", seq(
                "else",
                choice(
                    $.if_statement,
                    $.block_statement,
                ),
            ))),
        ),


        while_statement: $ => seq(
            "while",
            field("condition", $._expression),
            field("body", $.block_statement),
        ),

        return_statement: $ => seq(
            "return",
            field("value", optional($._expression)),
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

        operator_definition_statement: $ => seq(
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

        // Expressions

        _expression: $ => choice(
            $.literal,
            $.identifier,
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
            $.literal,
            $.identifier,
            $.block_expression,
            $.call_expression,
            $.curry_call_expression,
            $.function_expression,
            $.instantiation_expression,
            $.field_access_expression,
            $.if_expression,
        )),

        literal: $ => choice(
            $.number_literal,
            $.string_literal,
            $.boolean_literal,
            $.nah_literal,
        ),

        number_literal: $ => /\d+/,

        string_literal: $ => /"[^"]*"/,

        boolean_literal: $ => choice("true", "false"),

        nah_literal: $ => "nah",

        block_expression: $ => seq(
            "{",
            repeat($._statement),
            $._expression,
            "}",
        ),

        call_expression: $ => prec(1, seq(
            $._expression,
            "(",
            sepBy(",", $._expression),
            ")",
        )),

        curry_call_expression: $ => prec(1, seq(
            $._expression,
            "$(",
            sepBy(",", $._expression),
            ")",
        )),

        binaries_expression: $ => seq(
            $._nb_expression,
            repeat1(prec.left(seq(
                $.operator,
                $._nb_expression,
            ))),
        ),

        function_expression: $ => seq(
            "fn",
            "(",
            sepBy(",", $.identifier),
            ")",
            choice(
                $.block_statement,
                $.block_expression,
            ),
        ),

        instantiation_expression: $ => prec(1, seq(
            $._expression,
            ":{",
            sepBy(",", $._expression),
            "}",
        )),

        field_access_expression: $ => prec(1, seq(
            $._expression,
            ".",
            $.identifier,
        )),

        if_expression: $ => seq(
            "if",
            $._expression,
            $.block_expression,
            "else",
            choice(
                $.block_expression,
                $.if_expression,
            ),
        ),
    },
});


function sepBy1(sep, rule) {
    return seq(rule, repeat(seq(sep, rule)));
}


function sepBy(sep, rule) {
    return optional(sepBy1(sep, rule));
}