export function getPaginationParams(inPage: number, inLimit: number) {
  const page = inPage;
  const limit = inLimit;
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}
