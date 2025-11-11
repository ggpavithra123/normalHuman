// playground.ts
// import { db } from "./src/server/db.ts";

// console.log("✅ Loaded DATABASE_URL:", process.env.DATABASE_URL);

// async function main() {
//   await db.user.create({
//     data: {
//       emailAddress: "test@gmail.com",
//       firstName: "Elliott",
//       lastName: "Chong",
//     },
//   });

//   console.log("✅ User created successfully!");
// }

// // Run the async function and handle errors safely
// main()
//   .then(() => process.exit(0))
//   .catch((err) => {
//     console.error("❌ Error creating user:", err);
//     process.exit(1);
//   });

import Account from "./src/lib/account";


const acc = new Account('YuHCXZgyIuCN3s85vOgfbVzvCrr6V96KIzMulckSvNg')
// console.log(await acc.getUpdatedEmails({
//   deltaToken: 'H4sIAAAAAAAA_2NgZmBkAAOmtDkMLWAWx7aTDCwZJbk5APef07EdAAAA'
// }))
await acc.syncEmails()










// const addressesToUpsert = new Map()
// const email = {
//     from: { address: 'elliott@useincubate.com', name: 'Elliott Chong' },
//     to: [{ address: 'gmansoor@technologyrivers.com', name: 'Ghazenfer Mansoor' }],
//     cc: [],
//     bcc: [],
//     replyTo: [],
// }
// const all = [email.from, ...email.to, ...email.cc, ...email.bcc, ...email.replyTo]
// // console.log('all', JSON.stringify(all, null, 2))
// for (const address of all) {
//     addressesToUpsert.set(address.address, address);
// }
// for (const address of addressesToUpsert.values()) {
//     console.log('address', address)
// }

// console.log('addressesToUpsert', JSON.stringify(addressesToUpsert.entries(), null, 2))

// const upsertedAddresses: (Awaited<ReturnType<typeof upsertEmailAddress>> | null)[] = [];
// console.log('upserting addresses', JSON.stringify(addressesToUpsert.values(), null, 2))

// for (const address of addressesToUpsert.values()) {
//     const upsertedAddress = await upsertEmailAddress(address, accountId);
//     upsertedAddresses.push(upsertedAddress);
// }