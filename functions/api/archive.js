const REGISTRY = {
  "2024": {
    video: {
      Mahalaya:"1sEVgu7slalzAodTCh_EZdSx75JB8y0ZM",
      Sasthi:"1D1Mz4x5BC8L0YP0dIB587KtCNw_KL0Rf",
      Saptami:"1i28IVUBN2Mgjlo_509z-S_9HaTMqqnMP",
      Ashtami:"1Oc4K9tPzLM5Mww1uKsCoxb4HRaNpdm-1",
      Navami:"1xfok8_8LrYz1ZG3thlayrzYsED_-t6x-",
      Dashami:"1jza2htEUF6PfgPYMKHpKUfr94oPjR742"
    },
    photo: {
      Mahalaya:"1JYLUIJXjjrCj6wD8XT5MreSBlRXqzj4_",
      Sasthi:"1bzmz9SYkYrhhssDJyurAbMnBm3Okcp4J",
      Saptami:"14yVUMDRS3PLXDhq9-Dz8Lf9tFo_y2UOO",
      Ashtami:"1kfvcitYOQGzZZbwXnNVJ4ZXHMe3tl80H",
      Navami:"1kqaDWakQih57cEK8ALT5nqHG0fylp5U-",
      Dashami:"1axX8ozJTGt0sEOuIRGvRe8fQOcNBTTcl"
    }
  },

  "2025": {
    video: {
      Mahalaya:"10st3IHeXlhc_I6qOsZFYi3jooGIhasbe",
      Sasthi:"1ZHTkWO93gr8EF8c2WNoaMhWJqGMLUVcb",
      Saptami:"1dMNuTdN9zPqjaZlbUlJKLTuoeTOUnBSX",
      Ashtami:"1LmiltQ_6SoZGVc9lwnTF9MDxIzky4yYK",
      Navami:"1WcVIymbMio7GJI4tuXu2V9vnueKy54Yz",
      Dashami:"1HJkpeXt63D9Pj5lU684lpWDw1Au3SSzh"
    },
    photo: {
      Mahalaya:"1VdpGjXGWneakC63K8cCWBEYMKZFWw_BO",
      Sasthi:"1ykC655InF7McpmBzmBVbZnPDXSSnf4cN",
      Saptami:"1Nf0NYX2dvx_FqwB6P88F0kvZ4rW7hiBY",
      Ashtami:"1Po3x2PchWfnFVfMr5N-CC8t9PBAPGdOt",
      Navami:"1tJQUjwh5w2oL_NdSFFpz8ReBjLIflf17",
      Dashami:"1ftUYThXEWjvP6bZmKkz4e9RHyTJB37qA"
    }
  },

  "2026": {
    video: {
      Mahalaya:"1gn6IIFWL1vI_pFhCf6-SKDhPChXjjT0z",
      Sasthi:"1Twri9sOqTvmB2eNeRTffGU2wyjIeFncg",
      Saptami:"1XRPmB1TzQspzz7EtHJc-OC5aZms86wsO",
      Ashtami:"1TKLfd7Pu2Y5Pgae-dcem7QS7GlFKCp3D",
      Navami:"1xc0CuecGlcWagYAgZbG9bYl_XP5r4IEQ",
      Dashami:"1nMyb7zNj0UDFbr0roc51gRCeE_QMSUnf"
    },
    photo: {
      Mahalaya:"1V3KIQLZxtRSgtz2-Z80jbWofqytJbyeP",
      Sasthi:"1mLjZtj6-4Fz6I8oB6K57u8imxK6KcEu3",
      Saptami:"1mwKkYvZpzh6JDwL-3owpOZIp6eJPIzex",
      Ashtami:"1r3M4omNRdE1DoeAzvzYfaOHT7O19Z9Gu",
      Navami:"1NnEK7GFfq566BaC7erhxHWDIche3RgW_",
      Dashami:"16ZAn-8dmNb0ODd4rOS3fpc2Loci5Y5Fg"
    }
  },

  "previous": {
    video: {
      "Previous Years":"1rRmpGhK084KyTIKAbm4CsQzp58qh61iW"
    },
    photo: {
      "Previous Years":"11DlLoojlWg6HNA7zd6tsIqheiTiAPXTE"
    }
  }
};


async function listFolder(folderId, key) {
  const files = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields:
        "nextPageToken,files(id,name,mimeType,thumbnailLink,createdTime,modifiedTime,videoMediaMetadata)",
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
      throw new Error(
        `Google Drive API ${response.status}: ${await response.text()}`
      );
    }

    const data = await response.json();

    files.push(...(data.files || []));
    pageToken = data.nextPageToken || "";

  } while (pageToken);

  return files;
}


export async function onRequestGet(context) {
  try {

    const url = new URL(context.request.url);
    const year = url.searchParams.get("year");

    const registry = REGISTRY[year];

    if (!registry) {
      return Response.json(
        { error: "Unknown archive year" },
        { status: 400 }
      );
    }

    const key = context.env.GOOGLE_DRIVE_API_KEY;

    if (!key) {
      return Response.json(
        { error: "Archive service is not configured" },
        { status: 500 }
      );
    }

    const jobs = [];

    for (const [type, days] of Object.entries(registry)) {

      for (const [day, folderId] of Object.entries(days)) {

        jobs.push(

          listFolder(folderId, key).then(files =>

            files
              .map(file => ({
                ...file,

                year,

                day,

                type:
                  file.mimeType?.startsWith("video/")
                    ? "video"
                    : file.mimeType?.startsWith("image/")
                    ? "photo"
                    : type
              }))

              .filter(
                file =>
                  file.type === "video" ||
                  file.type === "photo"
              )
          )
        );
      }
    }

    const media = (await Promise.all(jobs)).flat();

    return Response.json(
      {
        generatedAt: new Date().toISOString(),
        year,
        count: media.length,
        media
      },
      {
        headers: {
          "Cache-Control":
            "public,max-age=300,s-maxage=900"
        }
      }
    );

  } catch (error) {

    console.error(error);

    return Response.json(
      { error: "Unable to load archive" },
      { status: 500 }
    );
  }
}
