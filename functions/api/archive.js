const FOLDERS = {
  "2024": [
    // VIDEOS
    { type: "video", day: "Mahalaya", id: "1sEVgu7slalzAodTCh_EZdSx75JB8y0ZM" },
    { type: "video", day: "Sasthi",   id: "1D1Mz4x5BC8L0YP0dIB587KtCNw_KL0Rf" },
    { type: "video", day: "Saptami",  id: "1i28IVUBN2Mgjlo_509z-S_9HaTMqqnMP" },
    { type: "video", day: "Ashtami",  id: "1Oc4K9tPzLM5Mww1uKsCoxb4HRaNpdm-1" },
    { type: "video", day: "Navami",   id: "1xfok8_8LrYz1ZG3thlayrzYsED_-t6x-" },
    { type: "video", day: "Dashami",  id: "1jza2htEUF6PfgPYMKHpKUfr94oPjR742" },

    // PHOTOS
    { type: "photo", day: "Mahalaya", id: "1JYLUIJXjjrCj6wD8XT5MreSBlRXqzj4_" },
    { type: "photo", day: "Sasthi",   id: "1bzmz9SYkYrhhssDJyurAbMnBm3Okcp4J" },
    { type: "photo", day: "Saptami",  id: "14yVUMDRS3PLXDhq9-Dz8Lf9tFo_y2UOO" },
    { type: "photo", day: "Ashtami",  id: "1kfvcitYOQGzZZbwXnNVJ4ZXHMe3tl80H" },
    { type: "photo", day: "Navami",   id: "1kqaDWakQih57cEK8ALT5nqHG0fylp5U-" },
    { type: "photo", day: "Dashami",  id: "1axX8ozJTGt0sEOuIRGvRe8fQOcNBTTcl" }
  ],

  "2025": [
    // VIDEOS
    { type: "video", day: "Mahalaya", id: "10st3IHeXlhc_I6qOsZFYi3jooGIhasbe" },
    { type: "video", day: "Sasthi",   id: "1ZHTkWO93gr8EF8c2WNoaMhWJqGMLUVcb" },
    { type: "video", day: "Saptami",  id: "1dMNuTdN9zPqjaZlbUlJKLTuoeTOUnBSX" },
    { type: "video", day: "Ashtami",  id: "1LmiltQ_6SoZGVc9lwnTF9MDxIzky4yYK" },
    { type: "video", day: "Navami",   id: "1WcVIymbMio7GJI4tuXu2V9vnueKy54Yz" },
    { type: "video", day: "Dashami",  id: "1HJkpeXt63D9Pj5lU684lpWDw1Au3SSzh" },

    // PHOTOS
    { type: "photo", day: "Mahalaya", id: "1VdpGjXGWneakC63K8cCWBEYMKZFWw_BO" },
    { type: "photo", day: "Sasthi",   id: "1ykC655InF7McpmBzmBVbZnPDXSSnf4cN" },
    { type: "photo", day: "Saptami",  id: "1Nf0NYX2dvx_FqwB6P88F0kvZ4rW7hiBY" },
    { type: "photo", day: "Ashtami",  id: "1Po3x2PchWfnFVfMr5N-CC8t9PBAPGdOt" },
    { type: "photo", day: "Navami",   id: "1tJQUjwh5w2oL_NdSFFpz8ReBjLIflf17" },
    { type: "photo", day: "Dashami",  id: "1ftUYThXEWjvP6bZmKkz4e9RHyTJB37qA" }
  ],

  "2026": [
    // VIDEOS
    { type: "video", day: "Mahalaya", id: "1gn6IIFWL1vI_pFhCf6-SKDhPChXjjT0z" },
    { type: "video", day: "Sasthi",   id: "1Twri9sOqTvmB2eNeRTffGU2wyjIeFncg" },
    { type: "video", day: "Saptami",  id: "1XRPmB1TzQspzz7EtHJc-OC5aZms86wsO" },
    { type: "video", day: "Ashtami",  id: "1TKLfd7Pu2Y5Pgae-dcem7QS7GlFKCp3D" },
    { type: "video", day: "Navami",   id: "1xc0CuecGlcWagYAgZbG9bYl_XP5r4IEQ" },
    { type: "video", day: "Dashami",  id: "1nMyb7zNj0UDFbr0roc51gRCeE_QMSUnf" },

    // PHOTOS
    { type: "photo", day: "Mahalaya", id: "1V3KIQLZxtRSgtz2-Z80jbWofqytJbyeP" },
    { type: "photo", day: "Sasthi",   id: "1mLjZtj6-4Fz6I8oB6K57u8imxK6KcEu3" },
    { type: "photo", day: "Saptami",  id: "1mwKkYvZpzh6JDwL-3owpOZIp6eJPIzex" },
    { type: "photo", day: "Ashtami",  id: "1r3M4omNRdE1DoeAzvzYfaOHT7O19Z9Gu" },
    { type: "photo", day: "Navami",   id: "1NnEK7GFfq566BaC7erhxHWDIche3RgW_" },
    { type: "photo", day: "Dashami",  id: "16ZAn-8dmNb0ODd4rOS3fpc2Loci5Y5Fg" }
  ]
};


export async function onRequestGet(context) {
  const key = context.env.GOOGLE_DRIVE_API_KEY;

  if (!key) {
    return json(
      { error: "GOOGLE_DRIVE_API_KEY is not configured" },
      500
    );
  }

  const url = new URL(context.request.url);
  const year = url.searchParams.get("year");

  if (!year || !FOLDERS[year]) {
    return json(
      {
        error: "A valid year is required",
        validYears: Object.keys(FOLDERS)
      },
      400
    );
  }

  try {
    const media = [];

    /*
     * Only the 12 final media folders belonging
     * to the requested year are queried.
     */
    for (const folder of FOLDERS[year]) {
      const files = await listFolder(folder.id, key);

      for (const file of files) {
        const actualType =
          file.mimeType?.startsWith("video/")
            ? "video"
            : file.mimeType?.startsWith("image/")
            ? "photo"
            : null;

        if (!actualType) continue;

        media.push({
          id: file.id,
          name: cleanName(file.name),
          mimeType: file.mimeType,
          type: actualType,
          year,
          day: folder.day,

          thumbnailLink: file.thumbnailLink || "",

          createdTime: file.createdTime || "",
          modifiedTime: file.modifiedTime || "",

          videoMediaMetadata:
            file.videoMediaMetadata || null,

          path: [
            year,
            actualType === "video" ? "Videos" : "Photos",
            folder.day
          ]
        });
      }
    }

    media.sort((a, b) =>
      (b.createdTime || "").localeCompare(
        a.createdTime || ""
      )
    );

    return json(
      {
        generatedAt: new Date().toISOString(),
        year,
        count: media.length,
        media
      },
      200,
      {
        /*
         * Browser refresh: 5 minutes
         * Cloudflare edge refresh: 15 minutes
         */
        "Cache-Control":
          "public,max-age=300,s-maxage=900"
      }
    );

  } catch (error) {
    console.error(
      `Archive scan failed for ${year}:`,
      error
    );

    return json(
      {
        error: "Unable to read Google Drive archive",
        year,
        detail: error.message
      },
      502
    );
  }
}


async function listFolder(folderId, key) {
  let pageToken = "";
  const all = [];

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,

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
      params.set("pageToken", pageToken);
    }

    const response = await fetch(
      "https://www.googleapis.com/drive/v3/files?" +
      params.toString()
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Drive API ${response.status} ` +
        `for folder ${folderId}: ` +
        errorText
      );
    }

    const data = await response.json();

    all.push(...(data.files || []));

    pageToken = data.nextPageToken || "";

  } while (pageToken);

  return all;
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
