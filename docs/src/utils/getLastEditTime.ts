// Adapted from https://github.com/fuma-nama/fumadocs/blob/main/packages/core/src/content/github.ts

interface CommitResponse {
  commit: { committer: { date: string } };
}

export async function getLastEditTime(path: string): Promise<Date | null> {
  // @ts-expect-error import.meta.env is typed by Astro's generated types (astro sync/build), not present in CI's `vp check`
  const token = import.meta.env.GITHUB_TOKEN;
  const params = new URLSearchParams({ path, page: "1", per_page: "1" });

  const headers = new Headers({ Accept: "application/vnd.github+json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(
    `https://api.github.com/repos/mirrordown/mirrordown/commits?${params}`,
    {
      headers
    }
  );

  if (!res.ok) return null;

  // GitHub API JSON response: typed at the trust boundary; no runtime guard
  // because we control the endpoint.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const data = (await res.json()) as CommitResponse[];
  if (data.length === 0) return null;

  return new Date(data[0].commit.committer.date);
}
