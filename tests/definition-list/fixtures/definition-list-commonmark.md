<!-- @case: Basic definition list with spacing variations -->

Term 1

: Definition 1

Term 2 with *inline markup*

: Definition 2

      { some code, part of Definition 2 }

  Third paragraph of definition 2.

<!-- @case: Lazy continuation and multiple paragraphs -->

Term 1

:   Definition
with lazy continuation.

    Second paragraph of the definition.

<!-- @case: Tilde marker and multiple definitions -->

Term 1
  ~ Definition 1

Term 2
  ~ Definition 2a
  ~ Definition 2b

<!-- @case: Different indentation levels and markers -->

Term 1
  :    paragraph

Term 2
  :     code block

Term 3
  :		code block

<!-- @case: Mixed markers and spacing -->

Term 1
:	Definition with tab after colon

Term 2
:  Definition with spaces after colon

Term 3
: First definition with colon
~ Second definition with tilde
: Third definition with colon

<!-- @case: Complex content in definitions -->

foo
: > bar
: baz

Complex Term
: Definition with list:
  
  - Item 1
  - Item 2
  
  > This is a quote
  > in the definition
  
      function test() {
        return true;
      }

<!-- @case: Nested definition lists -->

test
  : foo
      : bar
          : baz
      : bar
  : foo

<!-- @case: Tight lists (original functionality) -->

Term 1
: foo
: bar

Term 2
: foo
: bar

<!-- @case: Loose lists (original functionality) -->

Term 1

: Definition paragraph 1.

Term 2

: Definition paragraph 2.

<!-- @case: Different spacing patterns -->

Term 1
: foo

  bar
Term 2
: foo

Simple Term
: Definition 1

Another Term

: Another definition

Mixed Term
: Definition 1a

: Definition 1b

Final Term
: Definition 2

<!-- @case: Single character and long terms -->

A
: Short term definition

This is a very long term that spans multiple words and contains various punctuation marks, numbers 123, and special characters !@#$%
: Definition for the long term


<!-- @case: Formatted terms and interaction with other elements -->

# Heading

**Bold Term** with [link](http://example.com)
: Definition for formatted term

*Italic Term*
~ Definition with tilde marker

Term before heading
: Definition before heading

# Another Heading

<!-- @case: Multiple definitions with separation -->

First Term
: First def for first term
: Second def for first term

Second Term
: First def for second term
: Second def for second term

<!-- @case: A lazy continuation may start with a `:`, if it has enough indent. -->

apple
   : > computer company
     : red fruit

orange
   : > telecom company
   : orange fruit

chili's
   : > restaurant company
 : spicy fruit

<!-- @case: Empty or invalid definitions -->

Non-term 1
  :

Non-term 2
  :

Term
:Definition

Term
:   

Term
; Definition

Term
:

Another paragraph after empty definition

<!-- @case: Headers should not be treated as terms -->

# test
  : just a paragraph with a colon

<!-- @case: Multiple empty lines break definition list parsing -->

Term 1


: Definition with multiple empty lines above

Term 1
: Definition 1

Term 2


<!-- @case: Term 2 followed by a DD that is less indented than blkIndent -->

- Term 1
  : Def 1

  Term 2
 : Def 2

<!-- @case: Term 2 is less indented than blkIndent -->

- Term 1
  : Def 1
Term 2

<!-- @case: Term 1 followed by empty line then Term 2 -->

Term 1
: Def 1

Term 2
: Def 2

<!-- @case: Term 2 followed by something not a DD -->

Term 1
: Def 1

Term 2
Not a DD

<!-- @case: Marker followed by only spaces -->

Term 1
:    
Next line

<!-- @case: Term followed by empty line at end of file -->

Term

