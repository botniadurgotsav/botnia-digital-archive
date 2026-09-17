const ROOT_FOLDER_ID = "1QISCTNl0nkEsHvsnqTbjvmUKIvdpi7xx";
const FOLDER = "application/vnd.google-apps.folder";

const DAYS = [
  "Mahalaya",
  "Sasthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami"
];

export async function onRequestGet(context) {
  const key = context.env.GOOGLE_DRIVE_API_KEY;

  if (!key) {
    return json(
      { error: "GOOGLE_DRIVE_API_KEY is not configured" },
      500
    );
  }

  try {
    const media = await scanArchive(key);

    media.sort((a, b) => {
      const yearA = parseInt(a.year) || 0;
      const yearB = parseInt(b.year) || 0;

      if (yearA !== yearB) return yearB - yearA;

      return (b.createdTime || "").localeCompare(a.createdTime || "");
    });

    return json(
      {
        generatedAt: new Date().toISOString(),
        count: media.length,
        media
      },
      200,
      {
        "Cache-Control": "public,max-age=300,s-maxage=900"
      }
    );
  } catch (error) {
    console.error("Archive scan failed:", error);

    return json(
      {
        error: "Unable to read Google Drive archive",
        detail: error.message
      },
      502
    );
  }
}

async function scanArchive(key) {
  const media = [];

  /*
   * parentPaths stores the path belonging to every folder ID.
   *
   * Example:
   * folder ID -> ["2024", "Videos", "Navami"]
   */
  const parentPaths = new Map();

  parentPaths.set(ROOT_FOLDER_ID, []);

  /*
   * We scan Drive level-by-level rather than recursively.
   *
   * More importantly, multiple parent folders are queried together,
   * dramatically reducing the number of Google API calls.
   */
  let frontier = [ROOT_FOLDER_ID];

  /*
   * Current archive depth is small:
   *
   * ROOT
   *   -> YEAR
   *      -> Videos / Photos
   *         -> Puja Day
   *            -> Media
   *
   * 6 levels leaves room for an additional organisational folder.
   */
  const MAX_DEPTH = 6;

  for (let depth = 0; depth < MAX_DEPTH && frontier.length; depth++) {
    const items = await listChildrenBatched(frontier, key);

    const nextFrontier = [];

    for (const item of items) {
      const parentId =
        item.parents?.find(id => parentPaths.has(id)) ||
        item.parents?.[0];

      const parentPath = parentPaths.get(parentId) || [];

      if (item.mimeType === FOLDER) {
        const folderPath = [...parentPath, item.name];

        parentPaths.set(item.id, folderPath);
        nextFrontier.push(item.id);

        continue;
      }

      const type = item.mimeType?.startsWith("video/")
        ? "video"
        : item.mimeType?.startsWith("image/")
        ? "photo"
        : null;

      if (!type) continue;

      const year =
        parentPath.find(part => /^\d{4}$/.test(part)) ||
        "Previous Years";

      const day =
        parentPath.find(part => DAYS.includes(part)) ||
        "Other";

      media.push({
        id: item.id,
        name: cleanName(item.name),
        mimeType: item.mimeType,
        type,
        year,
        day,
        thumbnailLink: item.thumbnailLink || "",
        createdTime: item.createdTime || "",
        modifiedTime: item.modifiedTime || "",
        videoMediaMetadata: item.videoMediaMetadata || null,
        path: parentPath
      });
    }

    frontier = nextFrontier;
  }

  return media;
}

async function listChildrenBatched(parentIds, key) {
  const all = [];

  /*
   * Instead of:
   *
   * 1 folder = 1 Google request
   *
   * we ask Google for children of several folders in the SAME request.
   *
   * 20 keeps the query URL comfortably small.
   */
  const BATCH_SIZE = 20;

  for (let i = 0; i < parentIds.length; i += BATCH_SIZE) {
    const batch = parentIds.slice(i, i + BATCH_SIZE);

    const parentQuery = batch
      .map(id => `'${id}' in parents`)
      .join(" or ");

    let pageToken = "";

    do {
      const params = new URLSearchParams({
        q: `(${parentQuery}) and trashed=false`,
        fields:
          "nextPageToken,files(id,name,mimeType,parents,thumbnailLink,createdTime,modifiedTime,videoMediaMetadata)",
        pageSize: "1000",
        key
      });

      if (pageToken) {
        params.set("pageToken", pageToken);
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?${params}`
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Drive API ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();

      all.push(...(data.files || []));

      pageToken = data.nextPageToken || "";
    } while (pageToken);
  }

  return all;
}

function cleanName(name) {
  return (name || "").replace(
    /\.(mp4|mov|m4v|webm|jpg|jpeg|png|webp|gif)$/i,
    ""
  );
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    }
  });
}
