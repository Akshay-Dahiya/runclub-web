const handler = {
  get: function(target, prop) {
    if (prop === 'then') return undefined;
    return new Proxy(async () => [], handler);
  },
  apply: async function() {
    return [];
  }
};
const prisma = new Proxy({}, handler);

async function main() {
  console.log("user:", typeof prisma.user);
  console.log("upsert:", typeof prisma.user.upsert);
  console.log("result:", await prisma.user.upsert());
}
main();
