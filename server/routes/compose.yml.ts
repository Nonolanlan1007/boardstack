export default defineEventHandler(async (event) => {
  setHeader(event, "Content-Type", "application/yaml");
  setHeader(event, "Cache-Control", "public, max-age=3600");

  return await $fetch(
    "https://raw.githubusercontent.com/Nonolanlan1007/boardstack/master/compose.yml",
  );
});
