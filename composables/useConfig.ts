export default async function () {
  const data = await $fetch("/config");

  return data!;
}
