import { db } from "../../../../server/db.ts" 
export const POST = async (req: Request) => 
  { const { data } = await req.json(); console.log("data created:",data);
 //console.log("data created:",data.emailAddress[0].email_address);
  const id = data.id; // ✅ Safely extract the email 
  const emailAddress = data.email_addresses && data.email_addresses.length > 0 ? data.email_addresses[0].email_address : "no-email@example.com"; // fallback for testing 
  // const emailAddress = "John@gmail.com"; 
   const firstName = data.first_name; 
const lastName = data.last_name; 
   const imageUrl = data.image_url;
   await db.user.create(
    { data: 
      { id: id, emailAddress: emailAddress,
         firstName: firstName, 
         lastName: lastName, 
         imageUrl: imageUrl }, 
        }); 
        // await db.user.upsert({ // where: { id }, // update: { emailAddress, firstName, lastName, imageUrl }, // create: { id, emailAddress, firstName, lastName, imageUrl }, // }); c
         console.log("user created:"); return new Response('Webhook received', { status: 200 }); }