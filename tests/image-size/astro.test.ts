import { describe, expect, it } from "vite-plus/test";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import { remarkImageSize } from "../../packages/remd-image-size/src";
import { satteriImageSize } from "../../packages/sat-image-size/src";

// Astro's processors hand every attribute of an image they process to Astro's image pipeline, as the JSON of an `__ASTRO_IMAGE_` attribute that its Vite plugin replaces with the resized image. A remote image is processed when `image.domains` allows its host; a local one (a relative path) always, and the processor does not read the file, so none is needed here.
const image = { domains: [`example.com`] };
// remark collects images only for a document with a path; the file itself is not read.
const fileURL = new URL(`./document.md`, import.meta.url);

const processors = [
  [
    `remark`,
    async () =>
      createMarkdownProcessor({ image, remarkPlugins: [remarkImageSize] })
  ],
  [
    `sätteri`,
    async () =>
      createSatteriMarkdownProcessor({
        image,
        mdastPlugins: [satteriImageSize()]
      })
  ]
] as const;

// What the image pipeline receives: the attribute's JSON, its quotes written as references by either serializer.
const pipelineProps = (code: string): unknown => {
  const value = /__ASTRO_IMAGE_="([^"]*)"/.exec(code)?.[1];
  return value === undefined
    ? undefined
    : JSON.parse(value.replace(/&#x22;|&quot;/g, `"`));
};

describe.each(processors)("image-size in Astro's %s processor", (_, create) => {
  it("hands a remote image's width and height to the image pipeline", async () => {
    const { code } = await (
      await create()
    ).render(`![Engelbart|100x145](https://example.com/e.jpg)`, { fileURL });
    expect(pipelineProps(code)).toEqual({
      src: `https://example.com/e.jpg`,
      alt: `Engelbart`,
      width: `100`,
      height: `145`,
      index: 0
    });
  });

  it("hands a local image's width and height to the image pipeline", async () => {
    const { code } = await (
      await create()
    ).render(`![Engelbart|100x145](./e.jpg)`, { fileURL });
    expect(pipelineProps(code)).toEqual({
      src: `./e.jpg`,
      alt: `Engelbart`,
      width: `100`,
      height: `145`,
      index: 0
    });
  });

  it("writes the attributes on a remote image the pipeline does not process", async () => {
    const { code } = await (
      await create()
    ).render(`![Engelbart|100x145](https://other.example/e.jpg)`, { fileURL });
    expect(code.trim()).toBe(
      `<p><img src="https://other.example/e.jpg" alt="Engelbart" width="100" height="145"></p>`
    );
  });
});

// With a width alone, Astro's two processors ask the pipeline different things, by their own rule: remark asks it to infer a remote image's size unless both a width and a height are given, Sätteri only when neither is.
describe("image-size in Astro's processors: a remote image with a width alone", () => {
  const input = `![Engelbart|100](https://example.com/e.jpg)`;
  const props = {
    src: `https://example.com/e.jpg`,
    alt: `Engelbart`,
    width: `100`,
    index: 0
  };

  it("remark asks the pipeline to infer the size", async () => {
    const { code } = await (
      await processors[0][1]()
    ).render(input, {
      fileURL
    });
    expect(pipelineProps(code)).toEqual({ ...props, inferSize: true });
  });

  it("Sätteri does not", async () => {
    const { code } = await (
      await processors[1][1]()
    ).render(input, {
      fileURL
    });
    expect(pipelineProps(code)).toEqual(props);
  });
});
