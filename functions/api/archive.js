const TEST_FOLDER_ID = "1xfok8_8LrYz1ZG3thlayrzYsED_-t6x-";

export async function onRequestGet(context) {
  const key = context.env.GOOGLE_DRIVE_API_KEY;

  if (!key) {
    return json(
      { error: "GOOGLE_DRIVE_API_KEY is not configured" },
      500
    );
  }

  try {
    const files = await listFolder(TEST_FOLDER_ID, key);

    const media = files
      .filter(file =>
        file.mimeType?.startsWith("video/") ||
        file.mimeType?.startsWith("image/")
      )
      .map(file => ({
        id: file.id,
        name: cleanName(file.name),
        mimeType: file.mimeType,
        type: file.mimeType.startsWith("video/")
          ? "video"
          : "photo",

        year: "2024",
        day: "Navami",

        thumbnailLink: file.thumbnailLink || "",
        createdTime: file.createdTime || "",
        modifiedTime: file.modifiedTime || "",

        videoMediaMetadata:
          file.videoMediaMetadata || null,

        path: [
          "2024",
          "Videos",
          "Navami"
        ]
      }));

    return json(
      {
        generatedAt: new Date().toISOString(),
        count: media.length,
        media
      },
      200,
      {
        "Cache-Control": "no-store"
      }
    );

  } catch (error) {
    console.error("Drive test failed:", error);

    return json(
      {
        error: "Unable to read Google Drive archive",
        detail: error.message
      },
      502
    );
  }
}


async function listFolder(folderId, key) {

  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed=false`,

    fields:
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

  const response = await fetch(
    "https://www.googleapis.com/drive/v3/files?" +
    params.toString()
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Drive API ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  return data.files || [];
}


function cleanName(name) {
  return (name || "").replace(
    /\.(mp4|mov|m4v|webm|jpg|jpeg|png|webp|gif)$/i,
    ""
  );
}


function json(body, status = 200, headers = {}) {
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
