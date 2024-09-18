/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "sfml",

  extras: ($) => [/[ \r\t\n]+/, $.LINE_COMMENT],
  //inline: ($) => [$.LINE_COMMENT],

  rules: {
    program: ($) => seq(optional($.name), repeat($.trigger)),
    name: ($) => seq($.NAME, $.string),

    // TRIGGERS
    trigger: ($) =>
      choice(
        seq(
          $.EVERY,
          field("interval", $.interval),
          $.DO,
          optional($.block),
          $.END
        ),
        seq(
          $.EVERY,
          field("interval", $.redstonepulse),
          $.DO,
          optional($.block),
          $.END
        )
      ),
    redstonepulse: ($) => seq($.REDSTONE, $.PULSE),
    interval: ($) =>
      choice($.TICK, seq($.number, $.TICKS), seq($.number, $.SECONDS)),

    // BLOCK STATEMENT
    block: ($) => repeat1($.statement),
    statement: ($) =>
      choice(
        $.inputstatement,
        $.outputstatement,
        $.ifstatement,
        $.forgetstatement
        // $.LINE_COMMENT,
        // $.WS
      ),

    forgetstatement: ($) =>
      seq(
        $.FORGET,
        optional($.label),
        repeat(seq($.COMMA, $.label)),
        optional($.COMMA)
      ),
    inputstatement: ($) =>
      choice(
        seq(
          $.INPUT,
          optional($.inputmatchers),
          optional($.resourceexclusion),
          $.FROM,
          optional($.EACH),
          $.labelaccess
        ),
        seq(
          $.FROM,
          optional($.EACH),
          $.labelaccess,
          $.INPUT,
          optional($.inputmatchers),
          optional($.resourceexclusion)
        )
      ),
    outputstatement: ($) =>
      choice(
        seq(
          $.OUTPUT,
          optional($.outputmatchers),
          optional($.resourceexclusion),
          $.TO,
          optional($.EACH),
          $.labelaccess
        ),
        seq(
          $.TO,
          optional($.EACH),
          $.labelaccess,
          $.OUTPUT,
          optional($.outputmatchers),
          optional($.resourceexclusion)
        )
      ),
    inputmatchers: ($) => $.movement,
    outputmatchers: ($) => $.movement,

    movement: ($) =>
      choice(
        seq(
          $.resourcelimit,
          repeat(seq($.COMMA, $.resourcelimit)),
          optional($.COMMA)
        ),
        $.limit
      ),

    resourceexclusion: ($) =>
      seq(
        $.EXCEPT,
        $.resourceid,
        repeat(seq($.COMMA, $.resourceid)),
        optional($.COMMA)
      ),

    resourcelimit: ($) => seq(optional($.limit), $.resourceid),

    limit: ($) => choice(seq($.quantity, $.retention), $.retention, $.quantity),

    quantity: ($) => seq($.number, optional($.EACH)),
    retention: ($) => seq($.RETAIN, $.number, optional($.EACH)),

    sidequalifier: ($) =>
      choice(
        seq($.EACH, $.SIDE),
        seq($.side, repeat(seq($.COMMA, $.side)), $.SIDE)
      ),

    side: ($) => choice($.TOP, $.BOTTOM, $.NORTH, $.EAST, $.SOUTH, $.WEST),

    slotqualifier: ($) => seq($.SLOTS, $.rangeset),
    rangeset: ($) => seq($.range, repeat(seq($.COMMA, $.range))),
    range: ($) => seq($.number, optional(seq($.DASH, $.number))),

    ifstatement: ($) =>
      seq(
        $.IF,
        $.boolexpr,
        $.THEN,
        optional($.block),
        prec.left(
          1,
          prec.left(
            1,
            repeat(
              prec.left(
                1,
                seq($.ELSE, $.IF, $.boolexpr, $.THEN, optional($.block))
              )
            )
          )
        ),
        prec.left(1, optional(seq($.ELSE, optional($.block)))),
        $.END
      ),
    boolexpr: ($) =>
      choice(
        $.TRUE,
        $.FALSE,
        seq($.LPAREN, $.boolexpr, $.RPAREN),
        prec.left(1, seq($.NOT, $.boolexpr)),
        prec.left(1, seq($.boolexpr, $.AND, $.boolexpr)),
        prec.left(1, seq($.boolexpr, $.OR, $.boolexpr)),
        prec.left(
          1,
          seq(optional($.setOp), $.labelaccess, $.HAS, $.resourcecomparison)
        ),
        prec.left(1, seq($.REDSTONE, optional(seq($.comparisonOp, $.number))))
      ),

    resourcecomparison: ($) =>
      seq($.comparisonOp, $.number, optional($.resourceid)),
    comparisonOp: ($) =>
      choice(
        $.GT,
        $.LT,
        $.EQ,
        $.LE,
        $.GE,
        $.GT_SYMBOL,
        $.LT_SYMBOL,
        $.EQ_SYMBOL,
        $.LE_SYMBOL,
        $.GE_SYMBOL
      ),
    setOp: ($) => choice($.OVERALL, $.SOME, $.EVERY, $.EACH, $.SOME, $.LONE),

    // IO HELPERS
    labelaccess: ($) =>
      seq(
        $.label,
        repeat(seq($.COMMA, $.label)),
        optional($.roundrobin),
        optional($.sidequalifier),
        optional($.slotqualifier)
      ),
    roundrobin: ($) => seq($.ROUND, $.ROBIN, $.BY, choice($.LABEL, $.BLOCK)),
    label: ($) => choice(choice($.IDENTIFIER, $.REDSTONE), $.string),

    resourceid: ($) =>
      choice(
        seq(
          choice($.IDENTIFIER, $.REDSTONE),
          optional(
            seq(
              $.COLON,
              optional(choice($.IDENTIFIER, $.REDSTONE)),
              optional(
                seq(
                  $.COLON,
                  optional(choice($.IDENTIFIER, $.REDSTONE)),
                  optional(
                    seq($.COLON, optional(choice($.IDENTIFIER, $.REDSTONE)))
                  )
                )
              )
            )
          )
        ),
        $.string
      ),

    // GENERAL
    number: ($) => /[0-9]+/,
    string: ($) => /"([^"]|\\")*"/,

    //
    // LEXER
    //

    // IF STATEMENT
    IF: ($) => /IF/i,
    THEN: ($) => /THEN/i,
    ELSE: ($) => /ELSE/i,

    HAS: ($) => /HAS/i,
    OVERALL: ($) => /OVERALL/i,
    SOME: ($) => /SOME/i,
    ONE: ($) => /ONE/i,
    LONE: ($) => /LONE/i,

    // BOOLEAN LOGIC
    TRUE: ($) => /TRUE/i,
    FALSE: ($) => /FALSE/i,
    NOT: ($) => /NOT/i,
    AND: ($) => /AND/i,
    OR: ($) => /OR/i,

    // QUANTITY LOGIC
    GT: ($) => /GT/i,
    GT_SYMBOL: ($) => />/i,
    LT: ($) => /LT/i,
    LT_SYMBOL: ($) => /</i,
    EQ: ($) => /EQ/i,
    EQ_SYMBOL: ($) => /=/i,
    LE: ($) => /LE/i,
    LE_SYMBOL: ($) => /<=/i,
    GE: ($) => /GE/i,
    GE_SYMBOL: ($) => />=/i,

    // IO LOGIC
    MOVE: ($) => /MOVE/i,
    FROM: ($) => /FROM/i,
    TO: ($) => /TO/i,
    INPUT: ($) => /INPUT/i,
    OUTPUT: ($) => /OUTPUT/i,
    WHERE: ($) => /WHERE/i,
    SLOTS: ($) => /SLOTS/i,
    RETAIN: ($) => /RETAIN/i,
    EACH: ($) => /EACH/i,
    EXCEPT: ($) => /EXCEPT/i,
    FORGET: ($) => /FORGET/i,

    // ROUND ROBIN
    ROUND: ($) => /ROUND/i,
    ROBIN: ($) => /ROBIN/i,
    BY: ($) => /BY/i,
    LABEL: ($) => /LABEL/i,
    BLOCK: ($) => /BLOCK/i,

    // SIDE LOGIC
    TOP: ($) => /TOP/i,
    BOTTOM: ($) => /BOTTOM/i,
    NORTH: ($) => /NORTH/i,
    EAST: ($) => /EAST/i,
    SOUTH: ($) => /SOUTH/i,
    WEST: ($) => /WEST/i,
    SIDE: ($) => /SIDE/i,

    // TRIGGERS
    TICKS: ($) => /TICKS/i,
    TICK: ($) => /TICK/i,
    SECONDS: ($) => /SECONDS/i,
    // REDSTONE TRIGGER
    REDSTONE: ($) => /REDSTONE/i,
    PULSE: ($) => /PULSE/i,
    // PROGRAM SYMBOLS
    DO: ($) => /DO/i,
    WORLD: ($) => /WORLD/i,
    PROGRAM: ($) => /PROGRAM/i,
    END: ($) => /END/i,
    NAME: ($) => /NAME/i,

    // GENERAL SYMBOLS
    // used by triggers and as a set operator
    EVERY: ($) => /EVERY/i,

    COMMA: ($) => ",",
    COLON: ($) => ":",
    DASH: ($) => "-",
    LPAREN: ($) => "(",
    RPAREN: ($) => ")",

    IDENTIFIER: ($) => choice(/[a-zA-Z_*][a-zA-Z0-9_*]*/, "*"),

    LINE_COMMENT: ($) =>
      seq(
        field("start", alias("--", "comment_start")),
        field("content", alias(/[^\r\n]*/, "comment_content"))
      ),
  },
});
