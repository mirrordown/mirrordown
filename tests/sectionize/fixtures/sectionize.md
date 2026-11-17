<!-- @case: single heading -->

# Title

Body text.

<!-- @case: nested headings -->

# A

intro

## B

more

### C

deep

<!-- @case: sibling sections -->

## One

first

## Two

second

<!-- @case: preamble before first heading -->

Some intro text.

## First

body

<!-- @case: depth resets on sibling -->

## Left

a

### Left child

b

## Right

c

<!-- @case: heading only no body -->

## Empty

<!-- @case: skipped level -->

# Top

### Deep

content

<!-- @case: no headings -->

Just a paragraph with no headings at all.

<!-- @case: headings inside containers stay in place -->

# Top

> ## Quoted
>
> text

- ## Listed

after

<!-- @case: deeper heading before a shallower one inside a section is still wrapped -->

# A

#### D

d

## B

b

<!-- @case: document that starts deep then goes shallower wraps every heading -->

#### Deep

text

## Shallow

body

<!-- @case: ascending heading order wraps every heading -->

### C

c

#### D

d

## B

b

# A

a
