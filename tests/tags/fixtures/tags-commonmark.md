<!-- @case: spec 51: tags of every kind of tag character -->

#meeting #inbox/to-read #snake_case #kebab-case #y1984 #日本語

<!-- @case: spec 52: digits alone are not a tag -->

#1984

<!-- @case: spec 53: a tag ends at punctuation -->

Ends at punctuation: #tag. And #bob's.

<!-- @case: spec 54: a hash inside a word is text, and a tag can follow a tag -->

abc#def is not a tag.

#Bob#Alice is two.

<!-- @case: spec 55: a tag at the start of a line is not a heading -->

#notheading

# heading #tagged

<!-- @case: a tag needs one character that is not a decimal digit -->

#1984 #y1984 #1984y #1/2 #12-34 #12_34 #² #١٢٣

<!-- @case: the run of tag characters is taken whole -->

#1984a #a1984 #tag/sub/sub-sub_x

<!-- @case: a dash, an underscore or a slash alone is a tag -->

#- #_ #/ #--

<!-- @case: ascii punctuation and symbols end a tag -->

#a.b #a,b #a;b #a:b #a!b #a?b #a(b) #a'b #a"b #a$b #a%b #a+b #a=b #a@b #a^b #a~b #a|b #a&b #a<b #a>b #a{b} #a\b #a`b`

<!-- @case: letters, marks and numbers of any script are tag characters -->

#café #étude #Ünïcödé #ελληνικά #русский #한국어 #עברית #x² #½

<!-- @case: emoji and symbols outside ascii are tag characters -->

#🎉 #fam👨‍👩‍👧 #❤️ #🇯🇵 #©2024 #€ #a→b #✓done

<!-- @case: case is kept -->

#Meeting #MEETING #meeting

<!-- @case: a css colour of letters is a tag and one of digits is not -->

#fff is a tag, #c0ffee is a tag, #000 is not.

<!-- @case: a tag at the start of a paragraph -->

#start of a paragraph

<!-- @case: a tag after a space or a tab -->

a #space and	#tab

<!-- @case: a tag after a soft line break -->

line one
#two

<!-- @case: a tag after a hard line break -->

one  
#two\
#three

<!-- @case: tags one after another -->

#Bob#Alice#Carol and #a#1#b

<!-- @case: a hash after a hash is text -->

##tag and #tag# and #a##b

<!-- @case: a hash inside a word is text -->

abc#def C# a#1 x#y#z

<!-- @case: a hash after punctuation is text -->

(#tag) "#tag" -#tag ,#tag /#tag

<!-- @case: a hash straight after an inline element is text -->

**bold**#tag *em*#tag `code`#tag [link](url)#tag ![img](pic.png)#tag <https://example.com>#tag

<!-- @case: a tag opens the content of emphasis and strong -->

*#a* _#b_ **#c** __#d__ ***#e***

<!-- @case: a tag inside emphasis after a space -->

*see #a* and **also #b**

<!-- @case: a tag in a list item -->

- #one
- two #three

1. #ordered

<!-- @case: a tag in a blockquote -->

> #quoted
> and #more

<!-- @case: a tag in a list in a blockquote -->

> - #deep

<!-- @case: a tag in a heading -->

## #Tag in a heading

Setext #tag
===

<!-- @case: a heading holding only a tag -->

# #only

<!-- @case: more than six hashes is a paragraph of text -->

####### seven

<!-- @case: a tag at the very start and the very end of the document -->

#start then some text and #end

<!-- @case: never in a code span -->

`#code` and `x #y` and ``#z``

<!-- @case: never in a code block -->

```
#fenced
```

    #indented

<!-- @case: never in the text of a link -->

[#tag](url) [see #tag](url) [#ref] [#x][r] [#ref][]

[#ref]: url
[r]: url

<!-- @case: never in an autolink -->

<https://example.com/#fragment>

<!-- @case: never in image alt text -->

![#alt](pic.png) ![see #alt](pic.png)

<!-- @case: an escaped hash is text -->

\#tag and a \#tag

<!-- @case: a hash written as a character reference is text -->

&#35;tag &#x23;tag &num;tag

<!-- @case: an escaped character ends a tag -->

#ab\_cd #a\-b #a\/b

<!-- @case: a character written as a reference ends a tag -->

#ab&#99;d #a&eacute;b

<!-- @case: an escaped hash right after a tag is text -->

#tag\#more #tag&#35;more

<!-- @case: a hash after escaped punctuation is text -->

\(#tag\) \"#tag

<!-- @case: whitespace written as a reference counts as whitespace -->

a&#32;#tag a&nbsp;#tag
