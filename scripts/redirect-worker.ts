// Preserve bookmarks to the old production address after the app rename.
export default {
  fetch(request: Request) {
    const url = new URL(request.url);
    url.protocol = "https:";
    url.hostname = "aikonik.michalwilk139.workers.dev";
    url.port = "";
    return Response.redirect(url.toString(), 308);
  },
};
