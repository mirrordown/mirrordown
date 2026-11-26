# Changelog

## 0.1.0
<sub>2026-11-26</sub>

- *(minor)*
  New plugin set `cjk-friendly` for markdown-it and remark: emphasis and every other delimiter open and close beside Chinese, Japanese and Korean punctuation. The two presets turn it on by default. Sätteri resolves emphasis in its parser and does not have the rule yet.

  - **New: `@mirrordown/mdit-cjk-friendly` and `@mirrordown/remd-cjk-friendly`.** CommonMark decides whether `**` can open or close by the characters around it, with rules written for languages that put spaces between words. Beside CJK punctuation they fail. The plugins implement the [CommonMark CJK-friendly Amendments](https://github.com/tats-u/markdown-cjk-friendly/blob/main/specification.md).

    ```markdown
    **テスト。**テスト

    これは**「重要」**です

    **이름(Name)**은 필수입니다
    ```

    Was `<p>**テスト。**テスト</p>`, `<p>これは**「重要」**です</p>` and `<p>**이름(Name)**은 필수입니다</p>`. Now `<p><strong>テスト。</strong>テスト</p>`, `<p>これは<strong>「重要」</strong>です</p>` and `<p><strong>이름(Name)</strong>은 필수입니다</p>`.

  - **Strikethrough and the Mirrordown delimiters take the same rule.** `~~`, `==`, `++`, `--`, `||`, `~` and `^` are flanked as emphasis is, so they failed in the same places.

    ```markdown
    ~~削除。~~テスト

    これは==「重要」==です
    ```

    Was text in both. Now `<p><del>削除。</del>テスト</p>` (`<s>` in markdown-it) and `<p>これは<mark>「重要」</mark>です</p>`. In remark, `remd-mark`, `remd-ins`, `remd-del`, `remd-spoiler`, `remd-sub` and `remd-sup` read whether `remarkCjkFriendly` is in the processor, in any plugin order; without it they render as before.

  - **Text without CJK characters is unchanged**, with one exception the specification makes on purpose: punctuation followed by a variation selector is read as punctuation.

    ```markdown
    a**"b"**c

    **a.**b
    ```

    Both stay text, as in CommonMark.

  - **Presets: `cjkFriendly`, on by default** in `@mirrordown/preset-markdown-it` and `@mirrordown/preset-remark`. Turn it off with `cjkFriendly: false`. `@mirrordown/preset-satteri` has no such option yet.

  - **`@mirrordown/core`** decides every delimiter's flanking in one function, `delimiterFlanking`, with the amendment as an option. `createDelimitedTransform` and `scriptSyntax` take an optional reader that says whether it is on.
