const ARCHIVE_ROOT = "1QISCTNl0nkEsHvsnqTbjvmUKIvdpi7xx";

const YEAR_FOLDERS = [
  { year: "2026", id: "1ehSBZSa0RlVpzXFBcV2KiaIFATXC9J1N" },
  { year: "2025", id: "1dOBiACjDyO--2UdaQAvIr8yZqMHw0N25" },
  { year: "2024", id: "18jsP8Xgyu6dNyavr-ALWfNOMu3YZ9ugn" },
  { year: "Previous Years", id: "1lIcknGdjxpzsvIl2pZ5mG6DRwbbRDCah" }
];

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
    const media = [];

    for (const yearFolder of YEAR_FOLDERS) {
      await scanYear(
        yearFolder.id,
        yearFolder.year,
        key,
        media
      );
    }

    media.sort((a, b) => {
      const yearA = parseInt(a.year) || 0;
      const yearB = parseInt(b.year) || 0;

      if (yearA !== yearB) {
        return yearB - yearA;
      }

      return (b.createdTime || "").localeCompare(
        a.createdTime || ""
      );
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


/* -------------------------------------------------
   Scan one year
------------------------------------------------- */

async function scanYear(yearId, year, key, media) {

  const yearContents = await listFolder(yearId, key);

  /*
   * Expected structure:
   *
   * YEAR
   *   ├── Videos
   *   └── Photos
   */

  for (const category of yearContents) {

    if (category.mimeType !== FOLDER) {
      continue;
    }

    const categoryName = category.name.toLowerCase();

    if (
      categoryName !== "videos" &&
      categoryName !== "photos"
    ) {
      continue;
    }

    const categoryContents =
      await listFolder(category.id, key);

    /*
     * Expected:
     *
     * Videos
     *   ├── Mahalaya
     *   ├── Sasthi
     *   ├── Saptami
     *   ├── Ashtami
     *   ├── Navami
     *   └── Dashami
     */

    for (const dayFolder of categoryContents) {

      if (dayFolder.mimeType !== FOLDER) {
        continue;
      }

      const day =
        DAYS.find(
          d =>
            d.toLowerCase() ===
            dayFolder.name.toLowerCase()
        ) || dayFolder.name;

      const files =
        await listFolder(dayFolder.id, key);

      for (const file of files) {

        addMedia(
          file,
          year,
          day,
          category.name,
          media
        );
      }
    }
  }
}


/* -------------------------------------------------
   Add media item
------------------------------------------------- */

function addMedia(
  file,
  year,
  day,
  category,
  media
) {

  const type =
    file.mimeType?.startsWith("video/")
      ? "video"
      : file.mimeType?.startsWith("image/")
      ? "photo"
      : null;

  if (!type) {
    return;
  }

  media.push({
    id: file.id,
    name: cleanName(file.name),
    mimeType: file.mimeType,
    type,
    year,
    day,

    thumbnailLink:
      file.thumbnailLink || "",

    createdTime:
      file.createdTime || "",

    modifiedTime:
      file.modifiedTime || "",

    videoMediaMetadata:
      file.videoMediaMetadata || null,

    path: [
      year,
      category,
      day
    ]
  });
}


/* -------------------------------------------------
   Google Drive folder listing

   IMPORTANT:
   One parent folder per query.
------------------------------------------------- */

async function listFolder(folderId, key) {

  let pageToken = "";
  const all = [];

  do {

    const params = new URLSearchParams({
      q:
        `'${folderId}' in parents ` +
        `and trashed=false`,

      fields:
        "nextPageToken," +
        "files(" +
        "id," +
        "name," +
        "mimeType," +
        "thumbnailLink," +
        "createdTime," +
        "modifiedTime," +
        "videoMediaMetadata" +
        ")",

      pageSize: "1000",
      key
    });

    if (pageToken) {
      params.set(
        "pageToken",
        pageToken
      );
    }

    const response = await fetch(
      "https://www.googleapis.com/drive/v3/files?" +
      params.toString()
    );

    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        `Drive API ${response.status} ` +
        `for folder ${folderId}: ` +
        errorText
      );
    }

    const data =
      await response.json();

    all.push(
      ...(data.files || [])
    );

    pageToken =
      data.nextPageToken || "";

  } while (pageToken);

  return all;
}


/* -------------------------------------------------
   Helpers
------------------------------------------------- */

function cleanName(name) {

  return (name || "").replace(
    /\.(mp4|mov|m4v|webm|jpg|jpeg|png|webp|gif)$/i,
    ""
  );
}


function json(
  body,
  status = 200,
  headers = {}
) {

  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        ...headers
      }
    }
  );
}
