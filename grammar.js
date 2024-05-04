// noinspection JSUnresolvedReference

module.exports = grammar({
    name: "frugurt",

    extras: $ => [
        /\s/,
        $.comment,
    ],

    word: $ => $.identifier,

    supertypes: $ => [
        $._statement,
        $._expression,
        $._expression_unit,
        $._type_extension,
        $._literal,
    ],


    rules: {
        source_file: $ => repeat(field("body", $._statement)),

        // Misc

        // TODO: maybe add ' as valid symbol
        identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,

        operator: _ => choice(
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
            repeat(field("body", $._statement)),
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
            field("what", $._expression_unit),
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

        break_statement: _ => seq(
            "break",
            ";",
        ),

        continue_statement: _ => seq(
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
            "}",
            repeat(field("extensions", $._type_extension)),
        ),

        type_type: _ => choice("struct", "class", "data"),

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

        _type_extension: $ => choice(
            $.type_impl_extension,
            $.type_constraints_extension,
        ),

        type_impl_extension: $ => seq(
            "impl",
            "{",
            repeat(field("methods", $.type_method)),
            "}",
        ),

        type_method: $ => seq(
            optional(field("static", "static")),
            field("ident", $.identifier),
            field("parameters", $.formal_parameters),
            field("body", choice(
                $.block_statement,
                $.block_expression,
            )),
        ),

        type_constraints_extension: $ => seq(
            "constraints",
            "{",
            repeat(field("watches", $.type_watch)),
            "}",
        ),

        type_watch: $ => seq(
            "watch",
            "(",
            sepBy(field("args", $.identifier)),
            ")",
            field("body", $.block_statement),
        ),

        // Expressions

        _expression: $ => choice(
            $._expression_unit,
            $.binary_expression,
        ),

        _expression_unit: $ => choice(
            $._literal,
            $.variable,
            $.function_expression,
            $.block_expression,
            $.call_expression,
            $.curry_call_expression,
            $.instantiation_expression,
            $.field_access_expression,
            $.if_expression,
        ),

        _literal: $ => choice(
            $.number_literal,
            $.string_literal,
            $.bool_literal,
            $.nah_literal,
        ),

        number_literal: _ => /[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)/,

        // TODO: maybe add \uxxxx support
        string_literal: _ => /"(?:[^\\\n"]|\\[\\"tnvfr]|\\u\{[0-9a-fA-F]+}|\\\r?\n)*"/,

        bool_literal: _ => choice("true", "false"),

        nah_literal: _ => "nah",

        variable: $ => field("ident", $.identifier),

        function_expression: $ => seq(
            "fn",
            field("parameters", $.formal_parameters),
            field("body", choice(
                $.block_statement,
                $.block_expression,
            )),
        ),

        formal_parameters: $ => seq(
            "(",
            sepBy(field("args",
                choice(
                    $.positional_parameter,
                ),
            )),
            ")",
        ),

        positional_parameter: $ => field("ident", $.identifier),

        block_expression: $ => seq(
            "{",
            repeat(field("body", $._statement)),
            field("expr", $._expression),
            "}",
        ),

        call_expression: $ => seq(
            field("what", $._expression_unit),
            field("args", alias($.argument_list_call, $.argument_list)),
        ),

        curry_call_expression: $ => seq(
            field("what", $._expression_unit),
            field("args", alias($.argument_list_curry_call, $.argument_list)),
        ),

        instantiation_expression: $ => seq(
            field("what", $._expression_unit),
            field("args", alias($.argument_list_instantiation, $.argument_list)),
        ),

        argument_list_call: $ => seq(
            "(",
            sepBy(field("args", choice(
                $.positional_argument,
            ))),
            ")",
        ),

        argument_list_curry_call: $ => seq(
            "$(",
            sepBy(field("args", choice(
                $.positional_argument,
            ))),
            ")",
        ),

        argument_list_instantiation: $ => seq(
            ":{",
            sepBy(field("args", choice(
                $.positional_argument,
            ))),
            "}",
        ),


        positional_argument: $ => field("value", $._expression),

        field_access_expression: $ => seq(
            field("what", $._expression_unit),
            ".",
            field("field", $.identifier),
        ),

        binary_expression: $ => choice(
            ...([
                [1, "||"],
                [2, "&&"],
                [3, "=="],
                [3, "!="],
                [4, "<"],
                [4, ">"],
                [4, "<="],
                [4, ">="],
                [5, "+"],
                [5, "-"],
                [6, "*"],
                [6, "/"],
                [6, "%"],
                [7, "**"],
                [7, "<>"],
                [50, $.operator],
            ].map(
                ([precedence, operator]) =>
                    prec.left(precedence, seq(
                        field("left", $._expression),
                        field("operator", operator),
                        field("right", $._expression),
                    )),
            )),
        ),

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


function sepBy(rule, sep = ",") {
    return optional(
        seq(
            rule,
            repeat(seq(
                sep,
                rule)),
            optional(sep),
        ),
    );
}
