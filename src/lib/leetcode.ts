const ENDPOINT = "https://leetcode.com/graphql";

export type Auth = { session: string; csrf: string } | null;

export type Submission = {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: number; // unix seconds
  statusDisplay?: string;
  lang?: string;
};

async function gql<T>(query: string, variables: Record<string, unknown>, auth: Auth): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Referer: "https://leetcode.com",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  };
  if (auth) {
    headers.Cookie = `LEETCODE_SESSION=${auth.session}; csrftoken=${auth.csrf}`;
    headers["x-csrftoken"] = auth.csrf;
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`LeetCode GraphQL ${res.status}: ${await res.text().catch(() => "")}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(`LeetCode GraphQL: ${json.errors.map((e) => e.message).join("; ")}`);
  if (!json.data) throw new Error("LeetCode GraphQL returned no data");
  return json.data;
}

/** Accepted submissions only. Public — works without a cookie. */
export async function recentAccepted(username: string, limit = 20, auth: Auth = null) {
  const d = await gql<{ recentAcSubmissionList: Submission[] | null }>(
    `query recentAc($username: String!, $limit: Int!) {
       recentAcSubmissionList(username: $username, limit: $limit) {
         id title titleSlug timestamp
       }
     }`,
    { username, limit },
    auth,
  );
  return d.recentAcSubmissionList ?? [];
}

/** All submissions including failures — this is what powers grade inference. */
export async function recentSubmissions(username: string, limit = 20, auth: Auth = null) {
  const d = await gql<{ recentSubmissionList: Submission[] | null }>(
    `query recentSubs($username: String!, $limit: Int!) {
       recentSubmissionList(username: $username, limit: $limit) {
         id title titleSlug timestamp statusDisplay lang
       }
     }`,
    { username, limit },
    auth,
  );
  return d.recentSubmissionList ?? [];
}

export async function questionMeta(slug: string, auth: Auth = null) {
  const d = await gql<{
    question: {
      questionFrontendId: string; title: string; titleSlug: string; difficulty: string;
      topicTags: { name: string; slug: string }[];
      hints: string[];
    } | null;
  }>(
    `query q($titleSlug: String!) {
       question(titleSlug: $titleSlug) {
         questionFrontendId title titleSlug difficulty
         topicTags { name slug }
         hints
       }
     }`,
    { titleSlug: slug },
    auth,
  );
  return d.question;
}

/** Requires a valid session cookie. Returns null when unavailable. */
export async function submissionCode(submissionId: string, auth: Auth) {
  if (!auth) return null;
  try {
    const d = await gql<{ submissionDetails: { code: string; lang: { name: string } } | null }>(
      `query detail($submissionId: Int!) {
         submissionDetails(submissionId: $submissionId) { code lang { name } }
       }`,
      { submissionId: Number(submissionId) },
      auth,
    );
    if (!d.submissionDetails?.code) return null;
    return { code: d.submissionDetails.code, lang: d.submissionDetails.lang?.name ?? "unknown" };
  } catch {
    return null;
  }
}

/** Cheap liveness probe for the stored cookie. */
export async function cookieIsValid(auth: Auth): Promise<boolean> {
  if (!auth) return false;
  try {
    const d = await gql<{ userStatus: { isSignedIn: boolean } | null }>(
      `query { userStatus { isSignedIn } }`, {}, auth,
    );
    return Boolean(d.userStatus?.isSignedIn);
  } catch {
    return false;
  }
}

export const problemUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;
